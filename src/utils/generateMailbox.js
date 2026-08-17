const crypto = require('crypto')
const Mailbox = require('../models/Mailbox')
const ApiError = require('./ApiError')

const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'
const USERNAME_LENGTH = 6
const MAX_ATTEMPTS = 10

function randomUsername() {
  const bytes = crypto.randomBytes(USERNAME_LENGTH)
  let username = ''
  for (let i = 0; i < USERNAME_LENGTH; i += 1) {
    username += CHARS[bytes[i] % CHARS.length]
  }
  return username
}

function generateToken() {
  return crypto.randomBytes(24).toString('hex')
}

async function generateUniqueAddress() {
  const domain = process.env.MAIL_DOMAIN || 'temp.local'
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const username = randomUsername()
    const address = `${username}@${domain}`
    const exists = await Mailbox.exists({ address })
    if (!exists) {
      return { username, address }
    }
  }
  throw new ApiError(500, 'Could not generate a unique mailbox address')
}

module.exports = { generateUniqueAddress, generateToken, randomUsername }
