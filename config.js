// ================= BOT SETTINGS =================
module.exports = {
  // Timing settings
  MAX_AGE: 20,         // Only lock if <20 seconds old
  MIN_LOCK_AGE: 0.2,   // Must wait until question is at least 0.2s old
  

  // URLs
  WSS_URL: "wss://server.acsdoubts.com/v1/realtime?project=643c467a7dbb0655970d&channels[]=databases.643d4f079b55031ba6b6.collections.643d4f2cd70649dd9083.documents",
  LOCK_URL: "https://server.acsdoubts.com/v1/functions/lock-doubt/executions",
  CHECK_URL_BASE: "https://server.acsdoubts.com/v1/databases/643d4f079b55031ba6b6/collections/643d4f2cd70649dd9083/documents",
  
  // Firefox browser settings for Windows
  FIREFOX_PATH: "C:\\Program Files\\Mozilla Firefox\\firefox.exe",  // Windows Firefox path
  FIREFOX_PROFILE: process.env.APPDATA + "\\Mozilla\\Firefox\\Profiles",  // Windows Firefox profile directory
  HEADLESS: false,  // Set to true to run without UI
  
  // Website to navigate to (optional - if you want to click UI buttons)
  WEBSITE_URL: "https://acsdoubts.com"  // Change to your actual website
};
