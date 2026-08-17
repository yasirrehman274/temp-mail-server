const ApiError = require('../utils/ApiError')
const mailboxService = require('../services/mailboxService')
const emailService = require('../services/emailService')

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidFrom(value) {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  const match = trimmed.match(/^(.*?)\s*<([^>]+)>$/)
  const email = match ? match[2] : trimmed
  return EMAIL_REGEX.test(email)
}

async function getInbox(req, res, next) {
  try {
    const mailbox = await mailboxService.getMailbox(req.params.id, req.get('x-mailbox-token'))
    const emails = await emailService.getEmailsByMailbox(mailbox.id)
    res.json({ success: true, emails })
  } catch (err) {
    next(err)
  }
}

async function createTestEmail(req, res, next) {
  try {
    const { mailboxId, from, subject, text, html } = req.body
    if (!mailboxId) {
      throw new ApiError(400, 'mailboxId is required')
    }
    if (!isValidFrom(from)) {
      throw new ApiError(400, 'A valid from email address is required')
    }
    const email = await emailService.createTestEmail({ mailboxId, from, subject, text, html })
    console.warn(`[dev] test email created for mailbox ${mailboxId}`)
    res.status(201).json({ success: true, email })
  } catch (err) {
    next(err)
  }
}

async function getEmail(req, res, next) {
  try {
    const email = await emailService.getEmailById(req.params.id, req.get('x-mailbox-token'))
    res.json({ success: true, email })
  } catch (err) {
    next(err)
  }
}

async function deleteEmail(req, res, next) {
  try {
    await emailService.deleteEmailById(req.params.id, req.get('x-mailbox-token'))
    res.json({ success: true, message: 'Email deleted' })
  } catch (err) {
    next(err)
  }
}

module.exports = { getInbox, createTestEmail, getEmail, deleteEmail }
