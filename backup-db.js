const fs = require('fs')
const path = require('path')
const os = require('os')

function getDateString() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

function getDateTimeString() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${y}${m}${d}_${hh}${mm}${ss}`
}

function main() {
  const projectDir = __dirname
  const dbFile = path.join(projectDir, 'prisma', 'dev.db')
  const desktopDir = path.join(os.homedir(), 'Desktop')
  const backupDir = path.join(desktopDir, 'airport-db-backups')

  console.log('==========================================')
  console.log('   Airport DB Backup Tool')
  console.log('==========================================')
  console.log()

  if (!fs.existsSync(dbFile)) {
    console.log('ERROR: Database file not found:', dbFile)
    console.log('Make sure you have run the project at least once.')
    process.exit(1)
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const dateStr = getDateString()
  const dateTimeStr = getDateTimeString()
  const backupFileName = `airport-db_${dateTimeStr}.db`
  const backupFilePath = path.join(backupDir, backupFileName)

  console.log('Source:', dbFile)
  console.log('Target:', backupFilePath)
  console.log()

  try {
    fs.copyFileSync(dbFile, backupFilePath)

    // 只保留最近 30 天的备份
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('airport-db_') && f.endsWith('.db'))
      .sort()
      .reverse()

    const maxBackups = 30
    if (files.length > maxBackups) {
      console.log(`Cleaning old backups (keeping latest ${maxBackups})...`)
      for (let i = maxBackups; i < files.length; i++) {
        const oldFile = path.join(backupDir, files[i])
        fs.unlinkSync(oldFile)
        console.log('  Deleted:', files[i])
      }
    }

    console.log()
    console.log('==========================================')
    console.log('  Backup successful!')
    console.log('  File:', backupFileName)
    console.log('  Path:', backupDir)
    console.log('==========================================')
  } catch (err) {
    console.error('ERROR: Backup failed:', err.message)
    process.exit(1)
  }
}

main()
