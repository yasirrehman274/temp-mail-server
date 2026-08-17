const express = require('express')
const router = express.Router()
const ingestController = require('../controllers/ingestController')

router.post('/email', ingestController.ingestEmail)

module.exports = router
