const db = require('../../controllers/database')
const routerResponse = require('../../controllers/routerResponse')

const setBaseQueryParameters = require('../../middlewares/setQueryBaseOptions')('products')
const setResponseDetailLevel = require('../../middlewares/setResponseDetailLevel')('products')

module.exports = (() => {
  return [
    setBaseQueryParameters,
    setResponseDetailLevel,
    (req, res) => {
      return db.Products
        .findAll(req.queryOptions)
        .then(data => routerResponse.json({
          req, res, statusCode: 200, data
        })).catch(error => routerResponse.json({
          req,
          res,
          statusCode: 500,
          error,
          message: 'error getting product dataset'
        }))
    }]
})()
