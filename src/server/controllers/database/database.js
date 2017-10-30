const fs = require('fs-extra')
const path = require('path')
const Promise = require('bluebird')
const Sequelize = require('sequelize')

const eVars = require('../../config/eVars')
const dbConfig = require('../../config/database')
const logging = require('../../controllers/logging')

const sequelize = new Sequelize(dbConfig)

const db = {
  modelPath: path.join(__dirname, '../../models'),
  syncOps: [],
  Sequelize: Sequelize,
  sequelize: sequelize,
  initialize: initialize
}

module.exports = db // export the database access object

function initialize () {
  return verifyConnection()
    .then(() => { return fs.readdir(db.modelPath) })
    .then((fileList) => {
      return getModelFileList(fileList)
    })
    .then((modelFileList) => {
      registerModels(modelFileList, db.sequelize, db.Sequelize)
      prepSyncOps(modelFileList, db.syncOps)
      return executeSyncOps(db.syncOps)
    })
    .then(() => {
      logging.console('配置 ORM 系統關聯...')
      db.Series.hasMany(db.Products, injectOptions('seriesId', 'id'))
      db.Products.belongsTo(db.Series, injectOptions('seriesId', 'id'))
      db.Products.hasOne(db.Descriptions, injectOptions('productId', 'id'))
      db.Products.hasMany(db.Photos, injectOptions('productId', 'id'))
      db.Products.belongsToMany(db.Registrations, injectOptions(
        'productId', 'id', db.InterestedProducts // ,'registrationId'
      ))
      db.Photos.belongsTo(db.Products, injectOptions('productId', 'id'))
      db.Descriptions.belongsTo(db.Products, injectOptions('productId', 'id'))
      db.Countries.hasMany(db.Registrations, injectOptions('countryId', 'id'))
      db.Countries.hasMany(db.OfficeLocations, injectOptions('countryId', 'id'))
      db.Registrations.belongsTo(db.Countries, injectOptions('countryId', 'id'))
      db.Registrations.belongsToMany(db.Products, injectOptions(
        'registrationId', 'id', db.InterestedProducts // ,'productId'
      ))
      db.OfficeLocations.belongsTo(db.Countries, injectOptions('countryId', 'id'))
      db.OfficeLocations.hasMany(db.Users, injectOptions('officeLocationId', 'id'))
      db.Users.belongsTo(db.OfficeLocations, injectOptions('officeLocationId', 'id'))
      return fs.readdir(db.modelPath)
    })
    .then((fileList) => {
      return getModelFileList(fileList)
    })
    .then((modelFileList) => {
      // only to be used when generating a brand new database
      // in order to generate correct associations and physical table relations
      // IT'S DANGEROUS!!!
      // THIS WILL WIPE OUT ANY AND ALL EXISTING DATA WITHOUT CONFIRMATION
      // prepSyncOps(modelFileList, db.syncOps, { force: true })
      prepSyncOps(modelFileList, db.syncOps)
      return executeSyncOps(db.syncOps)
    })
    .then(() => {
      return Promise.resolve('資料庫初始化... 成功')
    })
    .catch((error) => {
      logging.error(error, '資料庫初始化... 失敗')
      return Promise.reject(error)
    })
}

function injectOptions (foreignKey, targetKey, throughModel = null, otherKey = null) {
  return Object.assign({
    constraints: true,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  }, {
    foreignKey: foreignKey,
    targetKey: targetKey
  }
    , throughModel === null ? {} : { through: throughModel }
    , otherKey === null ? {} : { otherKey: otherKey }
  )
}

function verifyConnection () {
  return db.sequelize
    .authenticate()
    .then(() => {
      logging.console('資料庫連線驗證... 成功')
      return Promise.resolve()
    })
    .catch((error) => {
      logging.error(error, '資料庫連線驗證... 失敗')
      return Promise.reject(error)
    })
}

function getModelFileList (fileList) {
  let modelFileList = fileList.filter((file) => {
    return ((file.indexOf('.') !== 0) && (file.slice(-3) === '.js'))
  })
  return Promise.resolve(modelFileList)
}

function registerModels (modelFileList, sequelize, Sequelize) {
  modelFileList.forEach((modelFile) => {
    db[modelName(modelFile)] = require(path.join(db.modelPath, modelFile))(sequelize, Sequelize)
  })
}

function modelName (fileName) {
  return fileName.slice(0, -3).charAt(0).toUpperCase() + fileName.slice(0, -3).slice(1)
}

function prepSyncOps (modelFileList, syncOps, typeObj = null) {
  modelFileList.forEach((modelFile) => {
    syncOps.push(
      typeObj === null ? db[modelName(modelFile)].sync() : db[modelName(modelFile)].sync(typeObj)
    )
  })
}

function executeSyncOps (syncOps) {
  return Promise
    .each(syncOps, (resolved, index) => {
      if (eVars.ORM_VERBOSE) logging.console(`${resolved.name} 資料表同步... 完成`)
    })
    .then(() => {
      logging.console('資料庫同步... 成功')
      return Promise.resolve()
    })
    .catch((error) => {
      logging.error(error, '資料庫同步... 失敗')
    })
}
