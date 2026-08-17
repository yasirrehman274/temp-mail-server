const express = require('express')
const cors = require('cors')
const mailboxRoutes = require('./routes/mailboxRoutes')
const emailRoutes = require('./routes/emailRoutes')
const ingestRoutes = require('./routes/ingestRoutes')
const devRoutes = require('./routes/devRoutes')

const app = express()

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
const allowedOrigins = clientUrl.split(',').map((origin) => origin.trim())

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        const error = new Error('Origin not allowed')
        error.status = 403
        callback(error)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-mailbox-token'],
  }),
)

app.use(express.json({ limit: '1mb' }))
app.use(express.text({ type: ['message/rfc822', 'text/plain'], limit: '5mb' }))

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok' })
})

app.use('/api/mailbox', mailboxRoutes)
app.use('/api/email', emailRoutes)
app.use('/api/ingest', ingestRoutes)
app.use('/api/dev', devRoutes)

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

app.use((err, req, res, next) => {
  const status = err.status || 500
  if (status === 500) {
    console.error(err)
  }
  const message = status === 500 ? 'Internal server error' : err.message
  res.status(status).json({ success: false, message })
})

module.exports = app
