# 🤖 Playwright Firefox Auto-Lock Bot

Auto-locking bot that listens to WebSocket for new questions and locks them automatically using your **pre-installed Firefox browser** with anti-detection features.

## ✨ Features

- 🦊 **Uses your pre-installed Firefox** (no separate browser download)
- 🚀 **Fast locking** (0.2-0.5s delay, human-like)
- 🎭 **Anti-detection** (stealth mode, realistic behavior)
- 🔄 **Real-time WebSocket** listener
- 🧠 **Smart monitoring** (checks if you already have a lock)
- ⏱️ **Human hesitation** (10% chance of 2s delay)

## 📦 Installation

### Windows:
```bash
# Install dependencies
npm install

# Find your Firefox path (usually one of these):
# C:\Program Files\Mozilla Firefox\firefox.exe
# C:\Program Files (x86)\Mozilla Firefox\firefox.exe
```

### Linux/Mac:
```bash
# Install dependencies
npm install

# Find your Firefox path
which firefox
```

## ⚙️ Configuration

Edit `config.js` to update your settings:

**For Windows:**
```javascript
FIREFOX_PATH: "C:\\Program Files\\Mozilla Firefox\\firefox.exe"
FIREFOX_PROFILE: process.env.APPDATA + "\\Mozilla\\Firefox\\Profiles"
```

**For Linux/Mac:**
```javascript
FIREFOX_PATH: "/usr/bin/firefox"
FIREFOX_PROFILE: process.env.HOME + "/.mozilla/firefox"
```

## 🚀 Usage

```bash
# Start the bot
npm start

# Or
node bot.js
```

## 🎯 How It Works

1. Launches your pre-installed Firefox with anti-detection
2. Connects to WebSocket to listen for new questions
3. When a new question arrives:
   - ✅ Checks if question age < 20 seconds
   - ✅ Waits if question is too new (< 0.2s)
   - ✅ Applies random delay (0.2-0.5s or 2s hesitation)
   - ✅ Sends lock request via API
4. Monitors every 60-90 seconds to check if you already have a lock

## 🛡️ Anti-Detection Features

- ✅ Disables `navigator.webdriver` flag
- ✅ Realistic user-agent and viewport
- ✅ Random human-like delays
- ✅ Uses your actual Firefox browser
- ✅ Authentic cookies and headers

## 🔧 Troubleshooting

**Windows - Firefox path error?**
```javascript
// Common Windows paths:
FIREFOX_PATH: "C:\\Program Files\\Mozilla Firefox\\firefox.exe"
FIREFOX_PATH: "C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe"
```

**Linux/Mac - Firefox path error?**
```bash
# Find your Firefox path
which firefox

# Update in config.js
FIREFOX_PATH: "/snap/bin/firefox"  // or your actual path
```

**Want to use Playwright's bundled Firefox?**
```javascript
FIREFOX_PATH: null  // Set to null
```

**Want headless mode?**
```javascript
HEADLESS: true  // Run without showing browser window
```

## 📊 Console Output

```
🟩 LOCKED → question_id       # Successfully locked
❌ Lock failed → question_id   # Lock attempt failed
📌 question_id | Age:2.5s     # New question detected
⚡ Fast human delay: 0.35s     # Random delay applied
🟢 No lock held → Bot active   # Monitoring status
```

## 🤝 Original Python Bot

This is a Playwright conversion of the original Python WebSocket bot, maintaining the same speed and logic while adding browser-based anti-detection features.