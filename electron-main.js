const { app, BrowserWindow, Menu, dialog } = require('electron')
const path = require('path')
const { spawn, exec } = require('child_process')

let mainWindow
let serverProcess = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, 'public', 'icon.svg'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: '机场设备管理系统',
  })

  const isDev = !app.isPackaged

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadURL(`file://${path.join(__dirname, '.next', 'server', 'app', 'page.html')}`)
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function startBackendServer() {
  const isDev = !app.isPackaged
  const serverPath = path.join(__dirname, 'server', 'index.ts')
  
  serverProcess = spawn('npx', ['tsx', serverPath], {
    cwd: __dirname,
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  serverProcess.stdout.on('data', (data) => {
    console.log('[Server]', data.toString())
  })

  serverProcess.stderr.on('data', (data) => {
    console.error('[Server Error]', data.toString())
  })

  serverProcess.on('close', (code) => {
    console.log('[Server] Process exited with code:', code)
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

const menuTemplate = [
  {
    label: '文件',
    submenu: [
      {
        label: '退出',
        accelerator: 'Ctrl+Q',
        click: () => {
          app.quit()
        },
      },
    ],
  },
  {
    label: '帮助',
    submenu: [
      {
        label: '关于',
        click: async () => {
          await dialog.showMessageBox(mainWindow, {
            title: '机场设备管理系统',
            message: '机场设备管理系统 v2.0.0\n\n基于 Next.js + Express + Electron 构建\n\n默认账号：admin / admin123',
            icon: path.join(__dirname, 'public', 'icon.svg'),
          })
        },
      },
    ],
  },
]

app.whenReady().then(() => {
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  startBackendServer()

  setTimeout(() => {
    createWindow()
  }, 2000)
})

app.on('window-all-closed', () => {
  stopBackendServer()
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
})
