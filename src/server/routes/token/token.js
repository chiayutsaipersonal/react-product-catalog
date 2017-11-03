const express = require('express')
const jwt = require('jsonwebtoken')

const db = require('../../controllers/database/database')
const encryption = require('../../controllers/encryption')
const eVars = require('../../config/eVars')
const routerResponse = require('../../controllers/routerResponse')

const router = express.Router()

router.post('/',
  loginInfoPresence,
  require('../../middlewares/botPrevention'),
  tokenRequest)

module.exports = router

function tokenRequest (req, res) {
  db.Users
    .findOne({
      where: {
        email: req.body.email,
        loginId: req.body.loginId,
        admin: true
      }
    })
    .then((apiUser) => {
      if (apiUser === null) { // reject the request if such user does not exist
        return routerResponse.json({
          req: req,
          res: res,
          statusCode: 401,
          message: 'incorrect login information'
        })
      }
      // hash the submitted password against the salt string
      let currentHash = encryption.sha512(req.body.password, apiUser.salt).passwordHash
      // compare with the stored hash
      if (currentHash === apiUser.password) { // hash verified
        let payload = {
          email: req.body.email,
          loginId: req.body.loginId
        }
        return routerResponse.json({
          req: req,
          res: res,
          statusCode: 200,
          data: {
            token: jwt.sign(payload, eVars.PASS_PHRASE, { expiresIn: '24h' })
          },
          message: 'token is supplied for 24 hours'
        })
      } else { // hash verification failed
        return routerResponse.json({
          req: req,
          res: res,
          statusCode: 401,
          message: 'incorrect login information'
        })
      }
    })
    .catch((error) => {
      return routerResponse.json({
        req: req,
        res: res,
        statusCode: 500,
        error: error,
        message: 'routes/token/token.js tokenRequest() errored'
      })
    })
}

function loginInfoPresence (req, res, next) {
  console.log(req.body.botPrevention)
  if (
    (req.body === undefined) ||
    (req.body.email === undefined) ||
    (req.body.loginId === undefined) ||
    (req.body.password === undefined) ||
    (req.body.botPrevention === undefined)
  ) {
    return routerResponse.json({
      req: req,
      res: res,
      statusCode: 401,
      message: 'login info is incomplete'
    })
  }
  next()
}
