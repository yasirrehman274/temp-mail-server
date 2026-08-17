const Mailbox = require('../models/Mailbox')
const Email = require('../models/Email')

async function runCleanup() {
  const now = new Date()
  const expiredMailboxes = await Mailbox.find({
    status: 'active',
    expiresAt: { $lte: now },
  }).select('_id')

  if (expiredMailboxes.length === 0) return

  const ids = expiredMailboxes.map((mailbox) => mailbox._id)
  await Mailbox.updateMany({ _id: { $in: ids } }, { $set: { status: 'expired' } })
  const result = await Email.deleteMany({ mailboxId: { $in: ids } })
  console.log(`Cleanup: expired ${ids.length} mailbox(es), deleted ${result.deletedCount} email(s)`)
}

function startCleanupService() {
  const minutes = Number(process.env.CLEANUP_INTERVAL_MINUTES) || 5
  runCleanup()
  const timer = setInterval(runCleanup, minutes * 60 * 1000)
  timer.unref()
  console.log(`Cleanup service running every ${minutes} minute(s)`)
}

module.exports = { runCleanup, startCleanupService }
