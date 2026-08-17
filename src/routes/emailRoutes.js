const express = require('express')
const router = express.Router()
const emailController = require('../controllers/emailController')

router.get('/:id', emailController.getEmail)
router.delete('/:id', emailController.deleteEmail)

module.exports = router
