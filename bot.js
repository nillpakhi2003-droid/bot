#!/usr/bin/env node
const { firefox } = require('playwright');
const WebSocket = require('ws');
const config = require('./config');

// Global state
let canLock = true;
let browser = null;
let page = null;

// ================= UTILITY FUNCTIONS =================
function randomDelay(min, max) {
  return Math.random() * (max - min) + min;
}

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function getQuestionAge(createdAt) {
  const created = new Date(createdAt.replace('Z', '+00:00'));
  const now = new Date();
  return (now - created) / 1000; // seconds
}

// ================= SEND LOCK REQUEST =================
async function lockQuestion(qid) {
  // Get user data from browser session (no hardcoded credentials needed)
  const payload = {
    data: JSON.stringify({
      questionId: qid
    })
  };

  try {
    const response = await page.evaluate(async (url, payload, projectId) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Appwrite-Project': projectId,
          'Content-Type': 'application/json'
        },
        credentials: 'include',  // Use browser's existing cookies
        body: JSON.stringify(payload)
      });
      return { status: res.status, ok: res.ok };
    }, config.LOCK_URL, payload, '643c467a7dbb0655970d');

    if (response.ok) {
      console.log(`\n🟩 LOCKED → ${qid}`);
    } else {
      console.log(`\n❌ Lock failed (status:${response.status}) → ${qid}`);
    }
  } catch (e) {
    console.log(`❌ Lock error ${qid} | ${e.message}`);
  }
}

// ================= HUMAN REAL DELAY =================
async function delayedLock(qid, age) {
  if (age < config.MIN_LOCK_AGE) {
    const waitTime = config.MIN_LOCK_AGE - age;
    console.log(`⌛ Waiting ${waitTime.toFixed(2)}s for question to mature...`);
    await sleep(waitTime);
  }

  // Human hesitation random 2 seconds (5-10% chance)
  let delay;
  if (Math.random() < 0.10) {
    delay = 2;
    console.log(`😐 Human hesitation → ${delay}s delay...`);
  } else {
    delay = randomDelay(0.2, 0.5);  // FAST MODE
    console.log(`⚡ Fast human delay: ${delay.toFixed(2)}s`);
  }

  await sleep(delay);
  await lockQuestion(qid);
}

// ================= CHECK USER HAS LOCK OR NOT =================
async function lockMonitor() {
  while (true) {
    await sleep(randomDelay(60, 90));  // Check every 1–1.5 min

    try {
      // Get current user ID from browser session
      const result = await page.evaluate(async (baseUrl, projectId) => {
        // First get current user account
        const accountRes = await fetch('https://server.acsdoubts.com/v1/account', {
          headers: { 'X-Appwrite-Project': projectId },
          credentials: 'include'
        });
        const account = await accountRes.json();
        const userId = account.$id;
        
        // Check if user has any locked questions
        const url = `${baseUrl}?queries[0]=equal("lockedBy",["${userId}"])`;
        const res = await fetch(url, {
          headers: { 'X-Appwrite-Project': projectId },
          credentials: 'include'
        });
        const data = await res.json();
        return data.total || 0;
      }, config.CHECK_URL_BASE, '643c467a7dbb0655970d');

      if (result === 0) {
        canLock = true;
        console.log('\n🟢 No lock held → Bot active');
      } else {
        canLock = false;
        console.log('\n🔴 You already locked a question → Paused until next check');
      }
    } catch (e) {
      console.log('⚠ Monitor failed:', e.message);
    }
  }
}

// ================= WEBSOCKET LISTENER =================
async function startWebSocketListener() {
  console.log('\n🔗 Connecting WebSocket...');
  
  const ws = new WebSocket(config.WSS_URL);

  ws.on('open', () => {
    console.log('🟢 Listening For New Questions (FAST .2–.5s Mode)\n');
    // Start lock monitor in background
    lockMonitor().catch(console.error);
  });

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      
      if (parsed.type !== 'event') return;

      const payload = parsed.data.payload;
      const qid = payload.$id;
      const locked = payload.isLocked;
      const created = payload.$createdAt;
      const age = getQuestionAge(created);

      console.log(`📌 ${qid} | Age:${age.toFixed(2)}s | Locked:${locked}`);

      if (canLock && !locked && age < config.MAX_AGE) {
        console.log('🔥 Scheduling lock...');
        delayedLock(qid, age).catch(console.error);
      } else {
        console.log('⏭ Skipped');
      }
    } catch (e) {
      console.error('Error parsing message:', e.message);
    }
  });

  ws.on('error', (error) => {
    console.log('⚠ WS Error:', error.message, '→ reconnecting');
  });

  ws.on('close', () => {
    console.log('⚠ WS closed → reconnecting in 2s');
    setTimeout(startWebSocketListener, 2000);
  });
}

// ================= LAUNCH FIREFOX WITH ANTI-DETECTION =================
async function launchBrowser() {
  console.log('🚀 Launching Firefox browser...');
  
  const launchOptions = {
    headless: config.HEADLESS,
    firefoxUserPrefs: {
      'dom.webdriver.enabled': false,
      'useAutomationExtension': false,
    }
  };
  
  // Only set executablePath if specified
  if (config.FIREFOX_PATH) {
    launchOptions.executablePath = config.FIREFOX_PATH;
  }
  
  browser = await firefox.launch(launchOptions);
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
    locale: 'en-US',
    timezoneId: 'Asia/Dhaka',
  });

  page = await context.newPage();

  // Inject anti-detection scripts
  await page.addInitScript(() => {
    // Override navigator.webdriver
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // Mock plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // Mock languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  });

  // Navigate to the website
  console.log(`🌐 Navigating to ${config.WEBSITE_URL}...`);
  await page.goto(config.WEBSITE_URL, { waitUntil: 'domcontentloaded' });
  
  console.log('⚠️  Please login manually in the browser window!');
  console.log('⏳ Waiting 30 seconds for you to login...');
  
  // Wait for user to login
  await sleep(30);
  
  console.log('✅ Browser ready! Starting bot...');
  
  // Start WebSocket listener
  await startWebSocketListener();
}

// ================= MAIN ENTRY POINT =================
async function main() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  🤖 Playwright Firefox Auto-Lock Bot 🤖  ║');
  console.log('╚═══════════════════════════════════════════╝\n');
  
  try {
    await launchBrowser();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n👋 Shutting down gracefully...');
  if (browser) await browser.close();
  process.exit(0);
});

// Start the bot
main();
