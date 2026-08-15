const { app, BrowserWindow, shell, ipcMain, dialog, session, Menu, MenuItem } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { spawn } = require('child_process');

// Force Hunspell spellcheck engine on Windows so addWordToSpellcheckerDictionary works reliably
app.commandLine.appendSwitch('disable-features', 'WinUseNativeSpellChecker,WinRetrieveSuggestionsOnlyOnDemand');


function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Kagaz',
    icon: path.join(__dirname, '../public/icon.png'),
    backgroundColor: '#090b10',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webviewTag: true,
      spellcheck: true,
    },
  });

// Persistent Custom Dictionary File Path in App Data
let customDictPath;

function loadCustomDictionary() {
  try {
    if (!customDictPath) {
      customDictPath = path.join(app.getPath('userData'), 'Custom Dictionary.txt');
    }
    if (fs.existsSync(customDictPath)) {
      const content = fs.readFileSync(customDictPath, 'utf-8');
      const lines = content.split(/\r?\n/).map(w => w.trim()).filter(Boolean);
      return new Set(lines);
    }
  } catch (err) {
    console.error('Error reading custom dictionary:', err);
  }
  return new Set(['Kagaz', 'kagaz', 'KAGAZ', 'Sinary', 'sinary', 'wikilink', 'wikilinks', 'autolink', 'markdown', 'callout']);
}

function saveCustomDictionary(wordsSet) {
  try {
    if (!customDictPath) {
      customDictPath = path.join(app.getPath('userData'), 'Custom Dictionary.txt');
    }
    const lines = Array.from(wordsSet).join('\n');
    fs.writeFileSync(customDictPath, lines, 'utf-8');
  } catch (err) {
    console.error('Error saving custom dictionary:', err);
  }
}

// Helper to add word and all casing/markdown variations to session spellcheckers & disk
const addVariationsToDictionary = (targetWord, mainWindowRef) => {
  if (!targetWord) return;
  const clean = targetWord.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
  const baseWords = new Set([targetWord, clean]);
  if (clean) {
    baseWords.add(clean.toLowerCase());
    baseWords.add(clean.toUpperCase());
    baseWords.add(clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase());
  }

  const currentDict = loadCustomDictionary();
  baseWords.forEach(w => {
    if (w) {
      currentDict.add(w);
      currentDict.add(`**${w}**`);
      currentDict.add(`_${w}_`);
    }
  });

  saveCustomDictionary(currentDict);

  const targetSessions = [session.defaultSession];
  if (mainWindowRef && mainWindowRef.webContents && mainWindowRef.webContents.session) {
    targetSessions.push(mainWindowRef.webContents.session);
  }

  targetSessions.forEach(ses => {
    if (ses && typeof ses.addWordToSpellcheckerDictionary === 'function') {
      currentDict.forEach(v => {
        try {
          ses.addWordToSpellcheckerDictionary(v);
        } catch (e) {}
      });
    }
  });
};

  // Preload brand and app terms into session
  ['Kagaz', 'kagaz', 'KAGAZ', 'Sinary', 'sinary', 'wikilink', 'wikilinks', 'autolink', 'markdown', 'callout'].forEach(w => {
    addVariationsToDictionary(w);
  });

  // Native Right-Click Context Menu for Spellcheck Suggestions & Text Operations
  mainWindow.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();

    // 1. Add Spelling Suggestions if right-clicked on a misspelled word
    if (params.misspelledWord) {
      if (params.dictionarySuggestions && params.dictionarySuggestions.length > 0) {
        for (const suggestion of params.dictionarySuggestions) {
          menu.append(
            new MenuItem({
              label: suggestion,
              click: () => mainWindow.webContents.replaceMisspelling(suggestion)
            })
          );
        }
      } else {
        menu.append(
          new MenuItem({
            label: 'No spelling suggestions',
            enabled: false
          })
        );
      }

      menu.append(new MenuItem({ type: 'separator' }));

      // Clean leading/trailing markdown characters for display
      const rawWord = params.misspelledWord;
      const cleanWord = rawWord.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
      const displayWord = cleanWord || rawWord;

      // Add to Dictionary option
      menu.append(
        new MenuItem({
          label: `Add "${displayWord}" to Dictionary`,
          click: () => {
            try {
              addVariationsToDictionary(rawWord, mainWindow);
              mainWindow.webContents.send('spellcheck:word-added', displayWord);
            } catch (err) {
              console.error('Failed to add word to dictionary:', err);
            }
          }
        })
      );

      menu.append(new MenuItem({ type: 'separator' }));
    }

    // 2. Cut, Copy, Paste, Select All for editable areas or text selections
    if (params.isEditable) {
      menu.append(new MenuItem({ role: 'cut' }));
      menu.append(new MenuItem({ role: 'copy' }));
      menu.append(new MenuItem({ role: 'paste' }));
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({ role: 'selectAll' }));
      menu.popup();
    } else if (params.selectionText && params.selectionText.trim() !== '') {
      menu.append(new MenuItem({ role: 'copy' }));
      menu.popup();
    } else if (params.misspelledWord) {
      menu.popup();
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url && !url.startsWith('http://localhost') && !url.startsWith('file://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

// Native Windows Directory Selection Dialog Handler
ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Folder / Vault Location for Kagaz Notes',
  });
  if (canceled || filePaths.length === 0) return null;
  return filePaths[0];
});

// Native Windows Single File Selection Dialog Handler
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Markdown Notes', extensions: ['md', 'markdown', 'txt'] }],
    title: 'Open Markdown Note in Kagaz',
  });
  if (canceled || filePaths.length === 0) return null;
  const fullPath = filePaths[0];
  const content = fs.readFileSync(fullPath, 'utf-8');
  const filename = path.basename(fullPath);
  return { path: fullPath, filename, content };
});

// Read all .md files recursively from selected directory
ipcMain.handle('fs:readVaultFiles', async (event, dirPath) => {
  if (!dirPath || !fs.existsSync(dirPath)) return {};
  try {
    const vaultMap = {};

    const readRecursive = (currentDir, baseDir) => {
      const items = fs.readdirSync(currentDir, { withFileTypes: true });
      items.forEach(item => {
        const fullPath = path.join(currentDir, item.name);
        if (item.isDirectory()) {
          readRecursive(fullPath, baseDir);
        } else if (item.isFile() && item.name.endsWith('.md')) {
          const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
          const content = fs.readFileSync(fullPath, 'utf-8');
          vaultMap[relativePath] = content;
        }
      });
    };

    readRecursive(dirPath, dirPath);
    return vaultMap;
  } catch (err) {
    console.error('Error reading vault files:', err);
    return {};
  }
});

// Save .md file directly to disk (auto-creates nested directories if needed)
ipcMain.handle('fs:saveVaultFile', async (event, { filePath, content }) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving file:', err);
    return false;
  }
});

// App Update In-App Downloader Handler
ipcMain.handle('updater:download', async (event, { url }) => {
  return new Promise((resolve) => {
    try {
      const tempPath = path.join(app.getPath('temp'), 'Kagaz_Setup_Update.exe');
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (e) {}
      }

      const file = fs.createWriteStream(tempPath);

      const downloadFile = (downloadUrl) => {
        const client = downloadUrl.startsWith('https') ? https : http;
        const request = client.get(downloadUrl, (response) => {
          // Handle HTTP redirects (301, 302, 307)
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            return downloadFile(response.headers.location);
          }

          if (response.statusCode !== 200) {
            return resolve({ success: false, error: `Server returned HTTP ${response.statusCode}` });
          }

          const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
          let downloadedBytes = 0;

          response.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            file.write(chunk);

            const percent = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
            try {
              event.sender.send('updater:progress', {
                percent,
                transferred: downloadedBytes,
                total: totalBytes,
              });
            } catch (e) {}
          });

          response.on('end', () => {
            file.end();
            resolve({ success: true, filePath: tempPath });
          });

          response.on('error', (err) => {
            file.close();
            try { fs.unlinkSync(tempPath); } catch (e) {}
            resolve({ success: false, error: err.message });
          });
        });

        request.on('error', (err) => {
          file.close();
          try { fs.unlinkSync(tempPath); } catch (e) {}
          resolve({ success: false, error: err.message });
        });
      };

      downloadFile(url);
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
});

// App Update Installer Launcher
ipcMain.handle('updater:install', async (event, { filePath }) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      spawn(filePath, [], { detached: true, stdio: 'ignore' }).unref();
      setTimeout(() => {
        app.quit();
      }, 800);
      return true;
    } catch (err) {
      console.error('Failed to launch installer executable', err);
    }
  }
  return false;
});


app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
app.commandLine.appendSwitch('disable-features', 'WebAuthentication,WebAuthenticationConditionalUI');
app.commandLine.appendSwitch('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

const desktopChromeUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const firefoxAuthUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0';

app.userAgentFallback = desktopChromeUserAgent;

app.whenReady().then(() => {
  const setupSession = (sess) => {
    if (!sess) return;
    sess.setUserAgent(desktopChromeUserAgent);

    sess.webRequest.onBeforeSendHeaders((details, callback) => {
      const url = details.url || '';
      const isGoogleAuth = url.includes('accounts.google.com') || url.includes('ServiceLogin') || url.includes('v3/signin') || url.includes('oauth2');

      // Remove any webview/electron identification headers case-insensitively
      Object.keys(details.requestHeaders).forEach((key) => {
        const lower = key.toLowerCase();
        if (
          lower === 'x-requested-with' || 
          lower === 'x-electron' || 
          lower === 'x-chrome-uma' ||
          (isGoogleAuth && (lower.startsWith('sec-ch-ua') || lower === 'user-agent'))
        ) {
          delete details.requestHeaders[key];
        }
      });

      if (isGoogleAuth) {
        // Firefox UA bypasses Chromium embedded webview checks & Passkey enforcement on Google Auth
        details.requestHeaders['User-Agent'] = firefoxAuthUserAgent;
      } else {
        details.requestHeaders['User-Agent'] = desktopChromeUserAgent;
        details.requestHeaders['Sec-Ch-Ua'] = '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"';
        details.requestHeaders['Sec-Ch-Ua-Mobile'] = '?0';
        details.requestHeaders['Sec-Ch-Ua-Platform'] = '"Windows"';
      }

      callback({ cancel: false, requestHeaders: details.requestHeaders });
    });

    sess.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = Object.assign({}, details.responseHeaders);
      
      Object.keys(responseHeaders).forEach((headerKey) => {
        const lowerKey = headerKey.toLowerCase();
        if (
          lowerKey === 'x-frame-options' || 
          lowerKey === 'content-security-policy' ||
          lowerKey === 'content-security-policy-report-only'
        ) {
          delete responseHeaders[headerKey];
        }
      });

      callback({
        cancel: false,
        responseHeaders,
      });
    });
  };

  setupSession(session.defaultSession);
  setupSession(session.fromPartition('persist:browserdrawer'));

  // Set Desktop Chrome User-Agent, early script injection, and popup navigation handler on all webview webContents
  app.on('web-contents-created', (event, contents) => {
    if (contents.getType() === 'webview') {
      contents.setUserAgent(desktopChromeUserAgent);

      const injectStealth = () => {
        contents.executeJavaScript(`
          try {
            if (!window.chrome) {
              window.chrome = {};
            }
            window.chrome.runtime = window.chrome.runtime || {};
            window.chrome.loadTimes = window.chrome.loadTimes || function() { return {}; };
            window.chrome.csi = window.chrome.csi || function() { return {}; };
            window.chrome.app = window.chrome.app || {};

            try {
              Object.defineProperty(window.screen, 'width', { get: () => 1920, configurable: true });
              Object.defineProperty(window.screen, 'height', { get: () => 1080, configurable: true });
              Object.defineProperty(window.screen, 'availWidth', { get: () => 1920, configurable: true });
              Object.defineProperty(window.screen, 'availHeight', { get: () => 1040, configurable: true });
              delete window.PublicKeyCredential;
              delete window.AuthenticatorResponse;
              delete window.AuthenticatorAssertionResponse;
              delete window.AuthenticatorAttestationResponse;
              delete window.Credential;
              Object.defineProperty(navigator, 'credentials', {
                get: () => undefined,
                configurable: true
              });
            } catch (err) {}

            Object.defineProperty(navigator, 'userAgentData', {
              get: () => ({
                brands: [
                  { brand: 'Google Chrome', version: '131' },
                  { brand: 'Chromium', version: '131' },
                  { brand: 'Not_A Brand', version: '24' }
                ],
                mobile: false,
                platform: 'Windows',
                getHighEntropyValues: async () => ({
                  architecture: 'x86',
                  bitness: '64',
                  brands: [
                    { brand: 'Google Chrome', version: '131' },
                    { brand: 'Chromium', version: '131' },
                    { brand: 'Not_A Brand', version: '24' }
                  ],
                  fullVersionList: [
                    { brand: 'Google Chrome', version: '131.0.6778.86' },
                    { brand: 'Chromium', version: '131.0.6778.86' },
                    { brand: 'Not_A Brand', version: '24.0.0.0' }
                  ],
                  mobile: false,
                  model: '',
                  platform: 'Windows',
                  platformVersion: '15.0.0',
                  uaFullVersion: '131.0.6778.86'
                })
              }),
              configurable: true
            });
            delete window.process;
            delete window.Buffer;
            delete navigator.webdriver;
          } catch(e) {}
        `).catch(() => {});
      };

      contents.on('did-start-loading', injectStealth);
      contents.on('dom-ready', injectStealth);

      contents.setWindowOpenHandler(({ url }) => {
        contents.loadURL(url);
        return { action: 'deny' };
      });
    }
  });

  try {
    if (typeof session.defaultSession.setSpellCheckerLanguages === 'function') {
      session.defaultSession.setSpellCheckerLanguages(['en-US']);
    }
  } catch (e) {
    console.error('Failed to set defaultSession spellchecker language:', e);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
