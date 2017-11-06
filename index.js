'use strict'

const electron = require('electron')

const app = electron.app

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')()

// prevent window being garbage collected
let mainWindow

function onClosed () {
  // dereference the window
  // for multiple windows store them in an array
  mainWindow = null
}

function createMainWindow () {
  const win = new electron.BrowserWindow({
    width: 1000,
    height: 600
  })

  win.loadURL(`file://${__dirname}/index.html`)
  win.on('closed', onClosed)

  return win
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (!mainWindow) {
    mainWindow = createMainWindow()
  }
})

app.on('ready', () => {
  mainWindow = createMainWindow()
})

var fs = require('fs')
var path = require('path')

// Δημιουργία αρχείου μόνο αν δεν υπάρχει ήδη
function createFile (filename) {
  fs.open(filename, 'r', function (err, fd) {
    if (err) {
      fs.writeFile(filename, '', function (err) {
        if (err) console.log(err)
        console.log('The file ' + filename + ' was saved!')
      })
    } else {
      console.log('The file ' + filename + ' exists!')
    }
  })
}

var katxml = path.normalize(path.join(app.getPath('userData'), 'katigories.xml'))
createFile(katxml)
var istxml = path.normalize(path.join(app.getPath('userData'), 'istiodromies.xml'))
createFile(istxml)
var yachtxml = path.normalize(path.join(app.getPath('userData'), 'yachts.xml'))
createFile(yachtxml)
