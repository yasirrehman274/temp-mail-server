const express = require('express')
const router = express.Router()
const mailboxController = require('../controllers/mailboxController')
const emailController = require('../controllers/emailController')

router.post('/create', mailboxController.createMailbox)
router.get('/:id', mailboxController.getMailbox)
router.get('/:id/emails', emailController.getInbox)
router.delete('/:id', mailboxController.deleteMailbox)

module.exports = router
