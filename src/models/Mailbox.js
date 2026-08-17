const mongoose = require('mongoose')

const mailboxSchema = new mongoose.Schema(
  {
    address: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ['active', 'expired'], default: 'active' },
  },
  { timestamps: true },
)

mailboxSchema.index({ expiresAt: 1 })

module.exports = mongoose.model('Mailbox', mailboxSchema)
