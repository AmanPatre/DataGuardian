# 🛡️ DataGuardian Extension Testing Instructions

## 🚀 **Quick Start**

### **Step 1: Build and Load Extension**

1. **Build the extension:**

   ```bash
   cd frontend
   npm run build
   ```

2. **Load in Chrome:**
   - Open Chrome → Extensions → Developer mode ON
   - Click "Load unpacked" → Select `frontend/dist` folder
   - Extension should appear in toolbar

### **Step 2: Test the Extension**

1. **Open test page:**

   - Navigate to `frontend/test-page.html` in your browser
   - Open Developer Tools (F12) → Console tab

2. **Check extension detection:**

   - Look for: `✅ DataGuardian Extension is active!`
   - If not detected, check console for debug info

3. **Test default state:**
   - Click **"Check Current Tracker Status"**
   - Should show: `❌ ALLOWED (not blocked)` for all trackers
   - Settings should show: `blockAdTrackers: false`

### **Step 3: Test Toggle Functionality**

1. **Open extension popup:**

   - Click DataGuardian icon in toolbar
   - Should show toggles in OFF state (unprotected)

2. **Toggle blocking ON:**

   - Turn ON "Block Ad Trackers"
   - Should see visual feedback: 🛡️ Protected
   - Should get notification: "Enhanced privacy protection activated"

3. **Test blocking:**
   - Refresh test page
   - Click **"Check Current Tracker Status"**
   - Should show: `✅ BLOCKED by DataGuardian` for Ad Tracker
   - Should show: `❌ ALLOWED` for Analytics/Social trackers

## 🔍 **What to Look For**

### **✅ Success Indicators:**

- Extension detected: `✅ DataGuardian Extension is active!`
- Content script running: `🛡️ DataGuardian Content Script: Ready`
- Default settings: All `false` values
- Toggle feedback: Visual changes when toggling
- Blocking works: `✅ BLOCKED by DataGuardian`

### **❌ Failure Indicators:**

- Extension not detected: `❌ DataGuardian Extension not detected`
- No content script: Missing initialization logs
- Wrong defaults: `blockAdTrackers: true` (should be `false`)
- No blocking: `❌ ALLOWED (not blocked)` when toggles are ON

## 🛠️ **Troubleshooting**

### **Extension Not Detected:**

1. Check if extension is loaded in Chrome Extensions page
2. Reload the extension if needed
3. Check console for error messages

### **Settings Wrong:**

1. Click **"Reset to Defaults"** button
2. Refresh the page
3. Check console for reset confirmation

### **Blocking Not Working:**

1. Verify toggles are ON in extension popup
2. Check console for blocking messages
3. Try different tracker test buttons

## 📊 **Console Log Examples**

### **Working Extension:**

```
🛡️ DataGuardian Content Script: Initializing...
📋 DataGuardian: Loaded settings: {blockAdTrackers: false, ...}
🛡️ DataGuardian Content Script: Ready
✅ DataGuardian Extension is active! (Content script detected)
```

### **Blocking Working:**

```
🧪 Testing Ad Tracker: https://www.googletagservices.com/tag/js/gpt.js
🚫 DataGuardian: Blocked fetch request to: https://www.googletagservices.com/tag/js/gpt.js
✅ CONFIRMED: Blocked by DataGuardian!
```

### **Settings Reset:**

```
🔄 === Resetting Extension Settings ===
✅ Settings reset successfully
📋 All tracker blocking is now DISABLED (default state)
```

## 🎯 **Expected Behavior**

1. **Default State:** All trackers allowed, toggles OFF
2. **Toggle ON:** Visual feedback, notifications, blocking active
3. **Toggle OFF:** Visual feedback, notifications, blocking disabled
4. **Test Results:** Clear success/failure indicators in console

## 📝 **Notes**

- The extension uses **declarativeNetRequest** for blocking
- **Content script** provides real-time monitoring
- **Background script** manages settings and rules
- **Test page** provides comprehensive debugging tools

If you encounter issues, check the console logs and share them for debugging!
