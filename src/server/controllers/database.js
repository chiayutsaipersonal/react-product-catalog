const path = require('path')
const Promise = require('bluebird')
const Sequelize = require('sequelize')

require('dotenv').config()

const accessPath = process.env.NODE_ENV === 'development'
  ? path.resolve('./src/server')
  : path.resolve('./dist')

const eVars = require(path.join(accessPath, 'config/eVars'))
const dbConfig = require(path.join(accessPath, 'config/database'))[eVars.USE_DATABASE]
const logging = require(path.join(accessPath, 'controllers/logging'))

const verifyConnection = require(path.join(__dirname, 'database/verifyConnection'))
const dropAllSchemas = require(path.join(__dirname, 'database/dropAllSchema'))
const prepModels = require(path.join(__dirname, 'database/prepModels'))
const registerModels = require(path.join(__dirname, 'database/registerModels'))
const syncModels = require(path.join(__dirname, 'database/syncModels'))
const reSyncModels = require(path.join(__dirname, 'database/reSyncModels'))

const sequelize = new Sequelize(dbConfig)

const dropSchemaSequence = [
  'users',
  'flags',
  'offices',
  'countries',
  'interests',
  'registrations',
  'labels',
  'tags',
  'photos',
  'products',
  'series',
  'carousels'
]

const db = {
  modelPath: path.join(accessPath, 'models'),
  fileList: [],
  modelList: [],
  syncOps: [],
  Sequelize: Sequelize,
  sequelize: sequelize,
  initialize: initialize
}

module.exports = db // export the database access object

function initialize (force = null) {
  return verifyConnection(db)
    .then(() => {
      if (force) {
        return dropAllSchemas(db.sequelize, dropSchemaSequence)
      } else {
        return Promise.resolve()
      }
    })
    .then(() => { return prepModels(db) })
    .then(() => {
      registerModels(db)
      return syncModels(db, force)
    })
    .then(() => {
      logging.console('配置 ORM 系統關聯...')
      db.Series.hasMany(db.Products, injectOptions('seriesId', 'id'))
      db.Series.hasOne(db.Photos, injectOptions('seriesId', 'id'))
      db.Products.belongsTo(db.Series, injectOptions('seriesId', 'id'))
      db.Products.hasMany(db.Photos, injectOptions('productId', 'id'))
      db.Products.belongsToMany(db.Registrations, injectOptions(
        'productId', 'id', db.Interests
      ))
      db.Products.belongsToMany(db.Tags, injectOptions(
        'productId', 'id', db.Labels
      ))
      db.Photos.belongsTo(db.Products, injectOptions('productId', 'id'))
      db.Photos.belongsTo(db.Series, injectOptions('seriesId', 'id'))
      db.Countries.hasMany(db.Registrations, injectOptions('countryId', 'id'))
      db.Countries.hasMany(db.Offices, injectOptions('countryId', 'id'))
      db.Countries.hasOne(db.Flags, injectOptions('id', 'id'))
      db.Flags.belongsTo(db.Countries, injectOptions('id', 'id'))
      db.Registrations.belongsTo(db.Countries, injectOptions('countryId', 'id'))
      db.Registrations.belongsToMany(db.Products, injectOptions(
        'registrationId', 'id', db.Interests
      ))
      db.Offices.belongsTo(db.Countries, injectOptions('countryId', 'id'))
      db.Offices.hasMany(db.Users, injectOptions('officeId', 'id'))
      db.Users.belongsTo(db.Offices, injectOptions('officeId', 'id'))
      db.Tags.belongsToMany(db.Products, injectOptions(
        'tagId', 'id', db.Labels
      ))
      return reSyncModels(db, force)
    })
    .then(() => {
      return Promise.resolve('資料庫初始化... 成功')
    })
    .catch((error) => {
      logging.error(error, '資料庫初始化... 失敗')
      return Promise.reject(error)
    })
}

function injectOptions (foreignKey, targetKey, throughModel = null, otherKey = null, constraints = true) {
  return Object.assign({
    constraints: constraints,
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