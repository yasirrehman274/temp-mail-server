const mongoose = require('mongoose')

const emailSchema = new mongoose.Schema(
  {
    mailboxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mailbox',
      required: true,
    },
    messageId: { type: String },
    from: { type: String, required: true },
    to: { type: String, required: true },
    subject: { type: String, default: '' },
    text: { type: String, default: '' },
    html: { type: String, default: '' },
    preview: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    receivedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
)

emailSchema.index({ mailboxId: 1, receivedAt: -1 })

module.exports = mongoose.model('Email', emailSchema)
