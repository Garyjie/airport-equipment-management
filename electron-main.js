const { app, shell } = require('electron')
const { spawn, exec } = require('child_process')

let serverProcess = null
let nextProcess = null

function startBackendServer() {
  const isDev = !app.isPackaged
  const appPath = isDev ? process.cwd() : app.getAppPath()

  if (isDev) {
    const serverEntry = require('path').join(appPath, 'server', 'index.ts')
    serverProcess = spawn('npx', ['tsx', serverEntry], {
      cwd: appPath,
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'pipe',
    })
  } else {
    const serverEntry = require('path').join(appPath, 'server', 'dist', 'index.js')
    const title = '机场设备管理系统 - 后端服务器'

    const startCmd = `start "${title}" cmd.exe /k "cd /d ${appPath} && node ${serverEntry} && exit"`
    exec(startCmd, (error) => {
      if (error) {
        console.error('[Server Error] Failed to start backend:', error)
      } else {
        console.log('[Server] Backend server started in new window')
      }
    })
    return
  }

  serverProcess.stdout.on('data', (data) => {
    console.log('[Server]', data.toString().trim())
  })

  serverProcess.stderr.on('data', (data) => {
    console.error('[Server Error]', data.toString().trim())
  })

  serverProcess.on('close', (code) => {
    console.log('[Server] Process exited with code:', code)
  })
}

function startNextServer() {
  const isDev = !app.isPackaged
  const appPath = isDev ? process.cwd() : app.getAppPath()

  if (isDev) {
    nextProcess = spawn('npx', ['next', 'dev', '-p', '3000'], {
      cwd: appPath,
      env: { ...process.env, NODE_ENV: 'development' },
      stdio: 'pipe',
    })
  } else {
    const title = '机场设备管理系统 - 前端服务器'
    const startCmd = `start "${title}" cmd.exe /k "cd /d ${appPath} && npx next start -p 3000 && exit"`
    exec(startCmd, (error) => {
      if (error) {
        console.error('[Next Error] Failed to start frontend:', error)
      } else {
        console.log('[Next] Frontend server started in new window')
      }
    })
    return
  }

  nextProcess.stdout.on('data', (data) => {
    console.log('[Next]', data.toString().trim())
  })

  nextProcess.stderr.on('data', (data) => {
    console.error('[Next Error]', data.toString().trim())
  })

  nextProcess.on('close', (code) => {
    console.log('[Next] Process exited with code:', code)
  })
}

function stopBackendServer() {
  if (serverProcess) {
    try {
      if (process.platform === 'win32') {
        exec(`taskkill /PID ${serverProcess.pid} /T /F`)
      } else {
        serverProcess.kill('SIGTERM')
      }
    } catch (error) {
      console.error('Error stopping server:', error)
    }
    serverProcess = null
  }
}

function stopNextServer() {
  if (nextProcess) {
    try {
      if (process.platform === 'win32') {
        exec(`taskkill /PID ${nextProcess.pid} /T /F`)
      } else {
        nextProcess.kill('SIGTERM')
      }
    } catch (error) {
      console.error('Error stopping next server:', error)
    }
    nextProcess = null
  }
}

app.whenReady().then(() => {
  console.log('[App] Starting Airport Equipment Management System...')

  startBackendServer()
  startNextServer()

  setTimeout(() => {
    console.log('[App] Opening browser at http://localhost:3000')
    shell.openExternal('http://localhost:3000')
  }, 5000)

  setTimeout(() => {
    console.log('[App] Application will keep running in background')
  }, 7000)
})

app.on('window-all-closed', () => {
  stopBackendServer()
  stopNextServer()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  stopBackendServer()
  stopNextServer()
})