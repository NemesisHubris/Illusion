# Kindle Browser Limitations & How to Run Scripts

## 🚨 CRITICAL TRUTH: Browser CANNOT Execute Shell Scripts

### What the Kindle Browser IS:
- WebKit 533.16 (Safari 5 equivalent)
- Sandboxed JavaScript environment
- Can read files via iframe
- Can use localStorage
- Can send LIPC messages to SYSTEM services only

### What the Kindle Browser CANNOT DO:
- ❌ Execute shell commands
- ❌ Run external scripts directly
- ❌ Access system processes
- ❌ Create custom LIPC services
- ❌ Write files to filesystem (except localStorage)

---

## 📖 Available APIs from Illusion Docs

### 1. Kindle Object (from The-Kindle-Object.md):

```javascript
// Device orientation
kindle.device.setOrientation(x);

// LIPC messaging - ONLY to registered system services!
kindle.messaging.sendMessage(id, eventType, eventData);
// id MUST be a system service like 'com.lab126.pillow'
// CANNOT be custom service like 'com.custom.soxplayer'!

// Network status
kindle.net.getWirelessState(); // Returns 'on' or 'off'

// Gestures (limited by config.xml)
kindle.gestures

// Logging (WARNING: sent to Amazon!)
kindle.device.log(logServiceName, logString, logLevel);
```

### 2. Mesquito SDK (from mesquito-sdk.js):

```javascript
// Read files via iframe
fetchFile(url, timeout, fixKindleFormatting);

// List directory contents
getDirectory(location);

// Join filesystem paths
joinPaths(path1, path2);

// Get query parameters
getQueryData();

// Logging to localStorage
window.mesquito.log(toLog);

// nativeBridge via pillow (LIMITED to LIPC operations)
nativeBridgeRunner(pillowID, fkt, callback);
// Can only do: nativeBridge.getIntLipcProperty() or setLipcProperty()
// CANNOT execute shell commands!
```

### 3. Standard Web APIs (ES5 only):

```javascript
// localStorage (writes to SQLite database)
localStorage.setItem(key, value);
localStorage.getItem(key);

// XMLHttpRequest (not fetch!)
var xhr = new XMLHttpRequest();

// DOM manipulation
document.getElementById(), createElement(), etc.

// Timers
setTimeout(), setInterval()
```

---

## ❌ What DOESN'T Work

### Attempted Approach 1: Direct Script Execution
```javascript
// THIS DOESN'T EXIST:
system.exec('/mnt/us/sox/play.sh'); // ❌ No such API!
kindle.system.run('/mnt/us/sox/play.sh'); // ❌ No such API!
```

**Result:** There is NO API to execute shell scripts from browser.

### Attempted Approach 2: Custom LIPC Services
```javascript
// THIS DOESN'T WORK:
kindle.messaging.sendMessage('com.custom.soxplayer', 'play', {...}); // ❌

// Daemon trying to listen:
lipc-wait-event com.custom.soxplayer \* // ❌ Service doesn't exist!
```

**Result:** Custom LIPC service names don't work. Messages are silently dropped.

### Attempted Approach 3: NativeBridge for Shell Execution
```javascript
// THIS DOESN'T WORK:
nativeBridgeRunner('exec', function() {
    nativeBridge.exec('/mnt/us/sox/play.sh'); // ❌ No exec() method!
}, callback);
```

**Result:** nativeBridge only has LIPC methods, not shell execution.

---

## ✅ What ACTUALLY Works

### Working Approach: localStorage + Daemon Polling

**How It Works:**

1. **Browser writes command to localStorage:**
   ```javascript
   localStorage.setItem('soxCommand', 'play:/mnt/us/music/song.mp3');
   ```

2. **localStorage is stored as SQLite database:**
   ```
   /var/local/mesquite/SoxPlayerSimple/localstorage/file__0.localstorage
   ```

3. **Daemon polls this database:**
   ```bash
   sqlite3 "$DB" "SELECT value FROM ItemTable WHERE key='soxCommand';"
   ```

4. **Daemon executes script:**
   ```bash
   /mnt/us/sox/play /mnt/us/music/song.mp3
   ```

**Why This Works:**
- Browser CAN write to localStorage (standard web API)
- Daemon CAN read SQLite database (filesystem access)
- Daemon CAN execute shell commands (it's a shell script)
- No custom LIPC services needed!

---

## 🎯 The Simplest Possible Solution

### What You Need:

1. **Illusion App (Browser UI)**
   - `SoxPlayerSimple/index.html` - UI with Play/Stop buttons
   - `SoxPlayerSimple/config.xml` - App configuration
   - `SoxPlayerSimple.sh` - Launcher scriptlet

2. **Daemon (Background Script)**
   - `sox/soxd.sh` - Polls localStorage and runs sox commands

3. **Sox Binaries**
   - `/mnt/us/sox/play` - Sox binary (you provide)
   - `/mnt/us/sox/sox` - Sox binary (you provide)

### File Structure:

```
/mnt/us/
├── documents/
│   ├── SoxPlayerSimple/
│   │   ├── index.html      ← Browser UI
│   │   ├── config.xml
│   │   ├── polyfill.min.js
│   │   └── mesquito-sdk.js
│   └── SoxPlayerSimple.sh  ← Launcher
├── sox/
│   ├── play                ← Sox binary (you provide)
│   ├── sox                 ← Sox binary (you provide)
│   └── soxd.sh             ← Daemon (we provide)
└── music/
    └── *.mp3               ← Your music
```

---

## 💡 Could We Use Simpler Scripts?

### Question: "Can we just have play.sh and stop.sh scripts?"

**Answer:** Yes, but browser STILL can't run them directly!

You could create:
```bash
# /mnt/us/sox/play.sh
#!/bin/sh
/mnt/us/sox/play "$1"
```

```bash
# /mnt/us/sox/stop.sh
#!/bin/sh
killall play
```

**BUT** - Browser still needs a daemon to execute these scripts!

The daemon is THE ONLY WAY to bridge browser → shell scripts.

---

## 🤔 Alternative: KUAL Integration

### What is KUAL?

KUAL (Kindle Unified Application Launcher) is a menu system that CAN run scripts.

**KUAL can:**
- Display menu items
- Execute shell scripts when clicked
- Access filesystem directly

**Difference from Illusion:**
- KUAL = Native menu system (not browser-based)
- Illusion = Browser-based UI (more flexible, but sandboxed)

**To use KUAL instead:**
Create `/mnt/us/extensions/SoxPlayer/menu.json`:
```json
{
    "items": [
        {
            "name": "Play Music",
            "action": "/mnt/us/sox/play.sh",
            "params": "/mnt/us/music/song.mp3"
        },
        {
            "name": "Stop Music",
            "action": "/mnt/us/sox/stop.sh"
        }
    ]
}
```

This gives you a menu that runs scripts directly.

**BUT** - No custom UI, just text menu items.

---

## 📊 Comparison of Approaches

| Approach | Browser UI | Can Execute Scripts | Complexity |
|----------|-----------|-------------------|------------|
| **KUAL Menu** | ❌ Text menu only | ✅ Directly | Low |
| **Illusion + Daemon** | ✅ Full HTML/CSS/JS | ✅ Via daemon | Medium |
| **Browser Only** | ✅ Full HTML/CSS/JS | ❌ IMPOSSIBLE | N/A |

---

## 🎯 Bottom Line

### The Truth:

**You CANNOT make a browser-only solution that executes scripts.**

The browser is sandboxed for security. It cannot execute shell commands.

### Your Options:

**Option 1: Illusion + Daemon (Current Approach)**
- ✅ Beautiful custom UI
- ✅ Can execute scripts
- ⚠️ Requires daemon running in background
- Current implementation: **WORKING**

**Option 2: KUAL Menu**
- ✅ Simple to set up
- ✅ Directly executes scripts
- ❌ No custom UI (just text menus)

**Option 3: Hybrid (KUAL + Illusion)**
- Use KUAL to start daemon
- Use Illusion for UI
- Best of both worlds

---

## ✅ What We Have NOW (Already Working!)

### Current Implementation:

1. **Browser** (`SoxPlayerSimple/index.html`):
   ```javascript
   // Click Play button
   localStorage.setItem('soxCommand', 'play:/mnt/us/music/song.mp3');
   ```

2. **Daemon** (`sox/soxd-fixed.sh`):
   ```bash
   # Polls every 0.5s
   CMD=$(sqlite3 "$DB" "SELECT value FROM ItemTable WHERE key='soxCommand';")
   # Executes sox
   /mnt/us/sox/play "$TRACK"
   ```

**Status:** THIS ALREADY WORKS!

### To Use:

```bash
# 1. Start daemon
/mnt/us/sox/soxd-fixed.sh &

# 2. Open SoxPlayerSimple from Kindle library

# 3. Click Play button

# 4. Music plays!
```

---

## 🤔 What Might Be Confusing

### Misconception: "Illusion apps can run scripts directly"

**Reality:** No browser can run scripts directly. The browser is sandboxed.

### Misconception: "There must be a simpler way"

**Reality:** localStorage + daemon IS the simplest way that works.

### Misconception: "We're overcomplicating this"

**Reality:** We're doing exactly what's necessary. The browser CANNOT execute scripts.

---

## 📝 If You Want Even Simpler...

### Absolute Minimum:

1. **Create simple play/stop scripts:**
   ```bash
   # /mnt/us/sox/play.sh
   #!/bin/sh
   /mnt/us/sox/play "$1" &
   ```

   ```bash
   # /mnt/us/sox/stop.sh
   #!/bin/sh
   killall play
   ```

2. **Create daemon that reads localStorage:**
   ```bash
   # /mnt/us/sox/daemon.sh
   #!/bin/sh
   DB="/var/local/mesquite/SoxPlayerSimple/localstorage/file__0.localstorage"
   while true; do
       CMD=$(sqlite3 "$DB" "SELECT value FROM ItemTable WHERE key='cmd';" 2>/dev/null | head -1)
       if [ "$CMD" = "play" ]; then
           sqlite3 "$DB" "DELETE FROM ItemTable WHERE key='cmd';"
           TRACK=$(sqlite3 "$DB" "SELECT value FROM ItemTable WHERE key='track';")
           /mnt/us/sox/play.sh "$TRACK"
       elif [ "$CMD" = "stop" ]; then
           sqlite3 "$DB" "DELETE FROM ItemTable WHERE key='cmd';"
           /mnt/us/sox/stop.sh
       fi
       sleep 0.5
   done
   ```

3. **Browser just writes localStorage:**
   ```javascript
   function playTrack(trackPath) {
       localStorage.setItem('track', trackPath);
       localStorage.setItem('cmd', 'play');
   }

   function stopTrack() {
       localStorage.setItem('cmd', 'stop');
   }
   ```

**This is as simple as it gets!**

---

## 🎓 Summary

1. **Browser CANNOT execute scripts** (security sandboxing)
2. **localStorage + daemon IS the working solution**
3. **We already have a working implementation**
4. **There is NO simpler way** (that works from browser)

**The current implementation with localStorage IS correct and IS the simplest approach that actually works!**

---

**Questions? Read this document again. The browser limitations are fundamental, not something we chose.**
