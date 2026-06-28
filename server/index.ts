import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import path from 'path'
import prisma from './prisma'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import deviceTypeRoutes from './routes/deviceTypes'
import stationRoutes from './routes/stations'
import counterRoutes from './routes/counters'
import deviceRoutes from './routes/devices'
import changeRecordRoutes from './routes/changeRecords'
import paperRecordRoutes from './routes/paperRecords'
import consumableRecordRoutes from './routes/consumableRecords'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Serve Next.js static files
const nextPath = path.resolve(__dirname, '..', '..', '.next', 'server', 'app')

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/device-types', deviceTypeRoutes)
app.use('/api/stations', stationRoutes)
app.use('/api/counters', counterRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api/change-records', changeRecordRoutes)
app.use('/api/paper-records', paperRecordRoutes)
app.use('/api/consumable-records', consumableRecordRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve Next.js pages and static files
app.use(express.static(nextPath))

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: '服务器内部错误' })
})

async function main() {
  try {
    await prisma.$connect()
    console.log('数据库连接成功')

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`服务器运行在 http://localhost:${PORT}`)
      console.log(`局域网访问: http://<你的IP>:${PORT}`)
    })
  } catch (error) {
    console.error('数据库连接失败:', error)
    process.exit(1)
  }
}

main()

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})