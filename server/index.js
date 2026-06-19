import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import staffRouter from './routes/staff.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/staff', staffRouter)

app.get('/healthz', (_req, res) => res.json({ ok: true }))

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => {
  console.log(`PNW Fitness API running on http://localhost:${PORT}`)
})
