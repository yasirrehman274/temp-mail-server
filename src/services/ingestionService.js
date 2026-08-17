const { simpleParser } = require('mailparser')
const Email = require('../models/Email')
const Mailbox = require('../models/Mailbox')
const ApiError = require('../utils/ApiError')
const mailboxService = require('./mailboxService')

function stripHtmlTags(value) {
  return String(value).replace(/<[^>]+>/g, ' ')
}

function makePreview(text, html) {
  const source = text && text.trim() ? text : stripHtmlTags(html)
  return source.trim().replace(/\s+/g, ' ').slice(0, 80)
}

function extractAddresses(input) {
  const addresses = new Set()

  function add(value) {
    const clean = String(value || '').trim().toLowerCase()
    if (clean) addresses.add(clean)
  }

  function collectText(text) {
    String(text || '')
      .split(/[,;]/)
      .forEach((part) => {
        const match = part.match(/<([^>]+)>/)
        add(match ? match[1] : part)
      })
  }

  function collectValue(value) {
    if (!value) return
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry && typeof entry === 'object') {
          if (entry.address) add(entry.address)
          else if (entry.text) collectText(entry.text)
        } else {
          add(entry)
        }
      })
    } else if (typeof value === 'object') {
      if (Array.isArray(value.value)) collectValue(value.value)
      else if (value.address) add(value.address)
      else if (value.text) collectText(value.text)
    } else {
      collectText(value)
    }
  }

  collectValue(input)
  return [...addresses]
}

async function storeEmailToMailbox(mailbox, { from, subject = '', text = '', html = '', messageId = null }) {
  await mailboxService.checkExpiration(mailbox)
  if (messageId) {
    const exists = await Email.exists({ mailboxId: mailbox._id, messageId })
    if (exists) return null
  }
  const data = {
    mailboxId: mailbox._id,
    from,
    to: mailbox.address,
    subject,
    text,
    html,
    preview: makePreview(text, html),
    isRead: false,
    receivedAt: new Date(),
    expiresAt: mailbox.expiresAt,
  }
  if (messageId) data.messageId = messageId
  return Email.create(data)
}

async function ingestStructured({ from, to, subject, text, html, messageId } = {}) {
  const fromAddress = extractAddresses(from)[0]
  const recipients = extractAddresses(to)
  if (!fromAddress) {
    throw new ApiError(400, 'Missing or invalid "from" address')
  }
  if (!recipients.length) {
    throw new ApiError(400, 'Missing or invalid "to" address')
  }

  const mailboxes = await Mailbox.find({ address: { $in: recipients } })
  const matched = new Map(mailboxes.map((mailbox) => [mailbox.address, mailbox]))
  const delivered = []
  const rejected = []
  let activeMatch = false

  for (const mailbox of mailboxes) {
    const isActive = mailbox.status !== 'expired' && mailbox.expiresAt > new Date()
    if (isActive) activeMatch = true
    try {
      const email = await storeEmailToMailbox(mailbox, {
        from: fromAddress,
        subject,
        text,
        html,
        messageId,
      })
      if (email) delivered.push({ address: mailbox.address, emailId: email._id.toString() })
    } catch (err) {
      if (err instanceof ApiError && err.status === 410) {
        rejected.push(mailbox.address)
      } else {
        throw err
      }
    }
  }

  for (const address of recipients) {
    if (!matched.has(address)) rejected.push(address)
  }

  if (!delivered.length) {
    if (activeMatch) {
      return { delivered, rejected, duplicate: true }
    }
    throw new ApiError(404, 'No active mailbox matched the recipient address')
  }
  return { delivered, rejected }
}

async function ingestRaw(raw) {
  if (!raw || !String(raw).trim()) {
    throw new ApiError(400, 'Empty email body')
  }
  const parsed = await simpleParser(raw, { htmlToText: true })
  return ingestStructured({
    from: parsed.from,
    to: parsed.to,
    subject: parsed.subject,
    text: parsed.text,
    html: parsed.html,
    messageId: parsed.messageId || null,
  })
}

module.exports = { ingestStructured, ingestRaw, storeEmailToMailbox, makePreview }
