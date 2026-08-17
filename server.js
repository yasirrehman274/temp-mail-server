require('dotenv').config()

const app = require('./src/app')
const { connectDB } = require('./src/config/db')
const { startCleanupService } = require('./src/services/cleanupService')

const PORT = process.env.PORT || 5000

async function start() {
  try {
    await connectDB()
    app.listen(PORT, () => {
      console.log(`API server listening on http://localhost:${PORT}`)
    })
    startCleanupService()
  } catch (err) {
    console.error('Failed to start server:', err.message)
    process.exit(1)
  }
}

start()
