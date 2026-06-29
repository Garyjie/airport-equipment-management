const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('==========================================')
  console.log('   Airport Equipment Management')
  console.log('   Database Migration Tool')
  console.log('==========================================')
  console.log()

  const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma')
  const envPath = path.join(__dirname, '.env')
  const prismaTsPath = path.join(__dirname, 'server', 'prisma.ts')

  console.log('Current database: SQLite (dev.db)')
  console.log()
  console.log('Select target database:')
  console.log()
  console.log('  [1] MySQL')
  console.log('  [2] PostgreSQL')
  console.log('  [3] SQLite (default)')
  console.log('  [4] Exit')
  console.log()

  const choice = await question('Enter your choice (1/2/3/4): ')
  console.log()

  if (choice === '1') {
    await switchToMySQL(schemaPath, envPath, prismaTsPath)
  } else if (choice === '2') {
    await switchToPostgreSQL(schemaPath, envPath, prismaTsPath)
  } else if (choice === '3') {
    await switchToSQLite(schemaPath, envPath, prismaTsPath)
  } else if (choice === '4') {
    console.log('Goodbye!')
    rl.close()
    return
  }

  console.log()
  await question('Press Enter to exit...')
  rl.close()
}

function updateSchemaProvider(schemaPath, provider) {
  let content = fs.readFileSync(schemaPath, 'utf8')
  // 只修改 datasource db 块里的 provider，不动 generator client
  content = content.replace(/(datasource db \{[\s\S]*?provider\s*=\s*")[^"]+("[\s\S]*?\})/, `$1${provider}$2`)
  fs.writeFileSync(schemaPath, content, 'utf8')
}

async function switchToMySQL(schemaPath, envPath, prismaTsPath) {
  console.log('==========================================')
  console.log('   Switching to MySQL')
  console.log('==========================================')
  console.log()
  console.log('Make sure you have:')
  console.log('  1. MySQL server installed and running')
  console.log('  2. Database created')
  console.log()

  const host = await question('MySQL host (default: localhost): ') || 'localhost'
  const port = await question('MySQL port (default: 3306): ') || '3306'
  const user = await question('Username (default: root): ') || 'root'
  const password = await question('Password: ')
  const database = await question('Database name (default: airport_db): ') || 'airport_db'

  console.log()
  console.log('[1/4] Installing MySQL adapter...')
  const { execSync } = require('child_process')
  execSync('npm install @prisma/adapter-mysql mysql2 --save', { stdio: 'inherit' })

  console.log()
  console.log('[2/4] Updating schema.prisma...')
  updateSchemaProvider(schemaPath, 'mysql')

  console.log('[3/4] Updating .env file...')
  let envContent = fs.readFileSync(envPath, 'utf8')
  envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="mysql://${user}:${password}@${host}:${port}/${database}"`)
  fs.writeFileSync(envPath, envContent, 'utf8')

  console.log()
  console.log('[4/4] Generating Prisma client and pushing schema...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  execSync('npx prisma db push', { stdio: 'inherit' })

  console.log()
  console.log('==========================================')
  console.log('  Successfully switched to MySQL!')
  console.log('==========================================')
  console.log()
  console.log('Note: You need to manually update server/prisma.ts')
  console.log('to use MySQL adapter. See docs for details.')
}

async function switchToPostgreSQL(schemaPath, envPath, prismaTsPath) {
  console.log('==========================================')
  console.log('   Switching to PostgreSQL')
  console.log('==========================================')
  console.log()
  console.log('Make sure you have:')
  console.log('  1. PostgreSQL server installed and running')
  console.log('  2. Database created')
  console.log()

  const host = await question('PostgreSQL host (default: localhost): ') || 'localhost'
  const port = await question('PostgreSQL port (default: 5432): ') || '5432'
  const user = await question('Username (default: postgres): ') || 'postgres'
  const password = await question('Password: ')
  const database = await question('Database name (default: airport_db): ') || 'airport_db'

  console.log()
  console.log('[1/4] Installing PostgreSQL adapter...')
  const { execSync } = require('child_process')
  execSync('npm install @prisma/adapter-pg pg --save', { stdio: 'inherit' })

  console.log()
  console.log('[2/4] Updating schema.prisma...')
  updateSchemaProvider(schemaPath, 'postgresql')

  console.log('[3/4] Updating .env file...')
  let envContent = fs.readFileSync(envPath, 'utf8')
  envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="postgresql://${user}:${password}@${host}:${port}/${database}"`)
  fs.writeFileSync(envPath, envContent, 'utf8')

  console.log()
  console.log('[4/4] Generating Prisma client and pushing schema...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  execSync('npx prisma db push', { stdio: 'inherit' })

  console.log()
  console.log('==========================================')
  console.log('  Successfully switched to PostgreSQL!')
  console.log('==========================================')
  console.log()
  console.log('Note: You need to manually update server/prisma.ts')
  console.log('to use PostgreSQL adapter. See docs for details.')
}

async function switchToSQLite(schemaPath, envPath, prismaTsPath) {
  console.log('==========================================')
  console.log('   Switching to SQLite')
  console.log('==========================================')
  console.log()

  console.log('[1/3] Updating schema.prisma...')
  updateSchemaProvider(schemaPath, 'sqlite')

  console.log('[2/3] Updating .env file...')
  let envContent = fs.readFileSync(envPath, 'utf8')
  envContent = envContent.replace(/DATABASE_URL=.*/, 'DATABASE_URL="file:./dev.db"')
  fs.writeFileSync(envPath, envContent, 'utf8')

  console.log()
  console.log('[3/3] Generating Prisma client...')
  const { execSync } = require('child_process')
  execSync('npx prisma generate', { stdio: 'inherit' })

  console.log()
  console.log('==========================================')
  console.log('  Successfully switched to SQLite!')
  console.log('==========================================')
}

main().catch(err => {
  console.error('Error:', err.message)
  rl.close()
  process.exit(1)
})
