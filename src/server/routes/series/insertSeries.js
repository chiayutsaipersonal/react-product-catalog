const db = require('../../controllers/database')
const logging = require('../../controllers/logging')
const routerResponse = require('../../controllers/routerResponse')

const validateJwt = require('../../middlewares/validateJwt')

module.exports = (() => {
  return [
    validateJwt,
    async (req, res) => {
      return db.Series
        .create({
          id: await nextAvailableId(),
          name: req.params.name,
          order: await nextAvailableValueInSequence()
        })
        .then((newSeriesRecord) => (() => {
          if (req.query.hasOwnProperty('details')) {
            return Promise.resolve(
              Object.assign(newSeriesRecord.dataValues, {
                products: [],
                photo: null
              })
            )
          } else { return Promise.resolve(newSeriesRecord) }
        })())
        .then((data) => {
          return routerResponse.json({
            req, res, statusCode: 200, data
          })
        })
        .catch(error => routerResponse.json({
          req,
          res,
          statusCode: 500,
          error,
          message: 'error inserting series record'
        }))
    }]
})()

function nextAvailableId () {
  let nextAvailableId = 0
  return db.Series
    .findAll()
    .map(series => series.id)
    .then((seriesIds) => {
      // loop through and find the next available unused id
      while (seriesIds.indexOf(nextAvailableId) !== -1) {
        nextAvailableId++
      }
      return Promise.resolve(nextAvailableId)
    })
    .catch(logging.reject('error getting the next available id value'))
}

function nextAvailableValueInSequence () {
  let nextAvailableValueInSequence = 0
  return db.Series
    .findAll()
    .map(series => series.order)
    .then((orderSequence) => {
      // loop through and find the next available order sequence value
      while (orderSequence.indexOf(nextAvailableValueInSequence) !== -1) {
        nextAvailableValueInSequence++
      }
      return Promise.resolve(nextAvailableValueInSequence)
    })
    .catch(logging.reject('error getting the next available order value'))
}
