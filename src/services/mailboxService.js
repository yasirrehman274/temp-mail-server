const mongoose = require('mongoose')
const Mailbox = require('../models/Mailbox')
const Email = require('../models/Email')
const ApiError = require('../utils/ApiError')
const { generateUniqueAddress, generateToken } = require('../utils/generateMailbox')

const EXPIRATION_MINUTES = Number(process.env.MAILBOX_EXPIRATION_MINUTES) || 10

function serializeMailbox(mailbox, includeToken = false) {
  const data = {
    id: mailbox._id.toString(),
    address: mailbox.address,
    username: mailbox.username,
    expiresAt: mailbox.expiresAt,
    status: mailbox.status,
  }
  if (includeToken) data.token = mailbox.token
  return data
}

async function findMailboxOrThrow(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid mailbox ID')
  }
  const mailbox = await Mailbox.findById(id)
  if (!mailbox) {
    throw new ApiError(404, 'Mailbox not found')
  }
  return mailbox
}

function verifyToken(mailbox, token) {
  if (!token || mailbox.token !== token) {
    throw new ApiError(403, 'Invalid or missing mailbox token')
  }
}

async function checkExpiration(mailbox) {
  if (mailbox.status !== 'expired' && mailbox.expiresAt <= new Date()) {
    mailbox.status = 'expired'
    await mailbox.save()
  }
  if (mailbox.status === 'expired') {
    throw new ApiError(410, 'This temporary email has expired.')
  }
}

async function createMailbox() {
  const { username, address } = await generateUniqueAddress()
  const token = generateToken()
  const expiresAt = new Date(Date.now() + EXPIRATION_MINUTES * 60 * 1000)
  const mailbox = await Mailbox.create({ address, username, token, expiresAt, status: 'active' })
  return serializeMailbox(mailbox, true)
}

async function getMailbox(id, token) {
  const mailbox = await findMailboxOrThrow(id)
  verifyToken(mailbox, token)
  await checkExpiration(mailbox)
  return serializeMailbox(mailbox)
}

async function deleteMailbox(id, token) {
  const mailbox = await findMailboxOrThrow(id)
  verifyToken(mailbox, token)
  await Email.deleteMany({ mailboxId: mailbox._id })
  await mailbox.deleteOne()
}

module.exports = {
  serializeMailbox,
  findMailboxOrThrow,
  verifyToken,
  checkExpiration,
  createMailbox,
  getMailbox,
  deleteMailbox,
}
