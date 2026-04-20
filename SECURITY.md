# Security Configuration Guide

## API Keys and Sensitive Data

Your API keys are now stored securely and are **NOT** committed to GitHub.

### File Structure

- **`config.example.js`** - Template showing the required configuration structure. Safe to commit.
- **`config.js`** - Your actual API keys and credentials. **NEVER commit this file** (excluded in `.gitignore`).
- **`.gitignore`** - Lists files that should never be committed to GitHub.

## Setup Instructions

### For Development (Local Setup)

1. Copy `config.example.js` to `config.js`:
   ```bash
   cp config.example.js config.js
   ```

2. Open `config.js` and fill in your actual API keys:
   ```javascript
   window.GAME_CONFIG = {
     ads: {
       key: 'YOUR_ADSTERRA_KEY_HERE',
       ...
     },
     firebase: {
       apiKey: "YOUR_FIREBASE_API_KEY_HERE",
       ...
     }
   };
   ```

3. The game will automatically load your configuration from `config.js`.

### For Production/Distribution

When deploying to production:
1. Create a new `config.js` with your production API keys
2. Ensure `.gitignore` is in place
3. Never commit `config.js` to version control
4. For CI/CD deployments, use environment variables or secure vaults to inject the `config.js` file

## What Changed

### Before (❌ UNSAFE):
- API keys hardcoded in `index.html`
- Keys visible in Git history
- Keys exposed on GitHub

### After (✅ SECURE):
- API keys stored in `config.js`
- `config.js` is git-ignored
- Keys are loaded at runtime
- Only `config.example.js` is committed

## Security Best Practices

1. ✅ Never commit `config.js` to Git
2. ✅ Keep `.gitignore` with `config.js` entry
3. ✅ Use `config.example.js` as a template for setup
4. ✅ Store secrets in environment variables for CI/CD
5. ✅ Rotate compromised API keys immediately

## API Key Rotation

If any API keys have been exposed:
1. Regenerate them in your respective dashboards:
   - Adsterra: https://adsterra.com/
   - Firebase: https://console.firebase.google.com/
2. Update `config.js` with new keys
3. Consider restricting key permissions to specific domains/IPs

## Checking Git History

To verify keys aren't in your Git history:
```bash
git log -p -S "AIzaSy" -- "*.html" "*.js"
```

If old keys are in history, you may need to use `git filter-branch` or `BFG Repo-Cleaner` to remove them and force push.
