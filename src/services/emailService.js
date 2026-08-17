const mongoose = require('mongoose')
const Email = require('../models/Email')
const ApiError = require('../utils/ApiError')
const mailboxService = require('./mailboxService')
const ingestionService = require('./ingestionService')

const LIST_FIELDS = 'from subject preview isRead receivedAt'
const DETAIL_FIELDS = 'from to subject text html preview isRead receivedAt mailboxId'

function serializeEmail(email) {
  return {
    id: email._id.toString(),
    from: email.from,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
    preview: email.preview,
    isRead: email.isRead,
    receivedAt: email.receivedAt,
  }
}

async function getEmailsByMailbox(mailboxId) {
  if (!mongoose.isValidObjectId(mailboxId)) {
    throw new ApiError(400, 'Invalid mailbox ID')
  }
  const emails = await Email.find({ mailboxId }).sort({ receivedAt: -1 }).select(LIST_FIELDS)
  return emails.map(serializeEmail)
}

async function createTestEmail({ mailboxId, from, subject = '', text = '', html = '' }) {
  if (!mongoose.isValidObjectId(mailboxId)) {
    throw new ApiError(400, 'Invalid mailbox ID')
  }
  const mailbox = await mailboxService.findMailboxOrThrow(mailboxId)
  const email = await ingestionService.storeEmailToMailbox(mailbox, { from, subject, text, html })
  return serializeEmail(email)
}

async function getEmailById(id, token) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid email ID')
  }
  const email = await Email.findById(id).select(DETAIL_FIELDS)
  if (!email) {
    throw new ApiError(404, 'Email not found')
  }

  const mailbox = await mailboxService.findMailboxOrThrow(email.mailboxId)
  mailboxService.verifyToken(mailbox, token)
  await mailboxService.checkExpiration(mailbox)

  if (!email.isRead) {
    email.isRead = true
    await email.save()
  }
  return serializeEmail(email)
}

async function deleteEmailById(id, token) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid email ID')
  }
  const email = await Email.findById(id)
  if (!email) {
    throw new ApiError(404, 'Email not found')
  }

  const mailbox = await mailboxService.findMailboxOrThrow(email.mailboxId)
  mailboxService.verifyToken(mailbox, token)

  await email.deleteOne()
}

async function deleteEmailsByMailbox(mailboxId) {
  await Email.deleteMany({ mailboxId })
}

module.exports = {
  getEmailsByMailbox,
  createTestEmail,
  getEmailById,
  deleteEmailById,
  deleteEmailsByMailbox,
}
