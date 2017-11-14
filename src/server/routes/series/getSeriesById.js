const db = require('../../controllers/database')
const routerResponse = require('../../controllers/routerResponse')

const setBaseQueryParameters = require('../../middlewares/setQueryBaseOptions')('series')
const setResponseDetailLevel = require('../../middlewares/setResponseDetailLevel')('series')

module.exports = (() => {
  return [
    setBaseQueryParameters,
    setResponseDetailLevel,
    (req, res) => {
      return db.Series
        .findById(req.params.seriesId, req.queryOptions)
        .then((data) => routerResponse.json({
          req, res, statusCode: 200, data
        }))
        .catch(error => routerResponse.json({
          req,
          res,
          statusCode: 500,
          error,
          message: 'series record query by id errored'
        }))
    }]
})()