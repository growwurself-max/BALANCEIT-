// IMPORTANT: Do NOT commit config.js to GitHub!
// This file contains sensitive API keys and credentials.
// 
// Instructions:
// 1. Copy this file and rename it to config.js
// 2. Fill in your actual API keys
// 3. Make sure config.js is in your .gitignore
// 4. Load this file in index.html BEFORE other scripts

window.GAME_CONFIG = {
  // Adsterra Ads Configuration
  ads: {
    key: 'YOUR_ADSTERRA_KEY_HERE',
    format: 'iframe',
    height: 250,
    width: 300,
    params: {}
  },

  // Firebase Configuration
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY_HERE",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  }
};
