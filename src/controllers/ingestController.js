const ApiError = require('../utils/ApiError')
const ingestionService = require('../services/ingestionService')

const INGEST_SECRET = process.env.INGEST_SECRET

function verifySecret(req) {
  if (!INGEST_SECRET) return
  if (req.get('x-ingest-secret') !== INGEST_SECRET) {
    throw new ApiError(403, 'Invalid ingest secret')
  }
}

async function ingestEmail(req, res, next) {
  try {
    verifySecret(req)
    const contentType = req.get('content-type') || ''
    let result
    if (/message\/rfc822|text\/plain/i.test(contentType)) {
      result = await ingestionService.ingestRaw(req.body)
    } else {
      result = await ingestionService.ingestStructured(req.body || {})
    }
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

module.exports = { ingestEmail }
