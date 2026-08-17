const mailboxService = require('../services/mailboxService')

async function createMailbox(req, res, next) {
  try {
    const mailbox = await mailboxService.createMailbox()
    res.status(201).json({ success: true, mailbox })
  } catch (err) {
    next(err)
  }
}

async function getMailbox(req, res, next) {
  try {
    const mailbox = await mailboxService.getMailbox(req.params.id, req.get('x-mailbox-token'))
    res.json({ success: true, mailbox })
  } catch (err) {
    next(err)
  }
}

async function deleteMailbox(req, res, next) {
  try {
    await mailboxService.deleteMailbox(req.params.id, req.get('x-mailbox-token'))
    res.json({ success: true, message: 'Mailbox deleted' })
  } catch (err) {
    next(err)
  }
}

module.exports = { createMailbox, getMailbox, deleteMailbox }
