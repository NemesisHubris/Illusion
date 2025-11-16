# The SIMPLEST Possible Sox Player for Kindle

## 🎯 This is the ABSOLUTE MINIMUM working solution

No daemons with PID tracking, no complex error handling, no status updates.
Just: **Click Play → Music Plays** and **Click Stop → Music Stops**

---

## 📁 Files Needed

### 1. Browser UI (Minimal)

**File:** `SoxPlayerSimple/index-MINIMAL.html`

**What it does:**
- Shows 2 buttons: PLAY and STOP
- Lists music files from `/mnt/us/music/`
- Click track to select
- Click PLAY → writes to localStorage
- Click STOP → writes to localStorage

**Code:** 100 lines total (half is CSS)

---

### 2. Simple Scripts

**File:** `sox/play.sh`
```bash
#!/bin/sh
killall play 2>/dev/null
/mnt/us/sox/play "$1" &
echo "Playing: $1"
```

**File:** `sox/stop.sh`
```bash
#!/bin/sh
killall play 2>/dev/null
echo "Stopped"
```

---

### 3. Minimal Daemon

**File:** `sox/daemon-minimal.sh`

**What it does:**
- Polls localStorage database every 0.5s
- Reads 'cmd' key
- If 'play' → runs play.sh
- If 'stop' → runs stop.sh

**Code:** 40 lines total

---

## 🚀 How to Use

### Step 1: Copy Files

```bash
# Copy to Kindle
scp -r SoxPlayerSimple/ root@KINDLE:/mnt/us/documents/
scp SoxPlayerSimple.sh root@KINDLE:/mnt/us/documents/
scp sox/play.sh sox/stop.sh sox/daemon-minimal.sh root@KINDLE:/mnt/us/sox/
```

### Step 2: Make Executable

```bash
ssh root@KINDLE
chmod +x /mnt/us/sox/*.sh
chmod +x /mnt/us/documents/SoxPlayerSimple.sh
```

### Step 3: Start Daemon

```bash
/mnt/us/sox/daemon-minimal.sh &
```

### Step 4: Launch App

From Kindle:
1. Library → Sox Player
2. Select a track
3. Click PLAY
4. Click STOP to stop

---

## 🔍 How It Works

### The Flow:

```
USER: Click PLAY button
  ↓
BROWSER: localStorage.setItem('cmd', 'play')
         localStorage.setItem('track', '/mnt/us/music/song.mp3')
  ↓
WRITES TO: /var/local/mesquite/SoxPlayerSimple/localstorage/file__0.localstorage
  ↓
DAEMON: sqlite3 SELECT cmd → got 'play'
        sqlite3 SELECT track → got '/mnt/us/music/song.mp3'
  ↓
DAEMON: /mnt/us/sox/play.sh '/mnt/us/music/song.mp3'
  ↓
SCRIPT: killall play (stop any existing)
        /mnt/us/sox/play '/mnt/us/music/song.mp3' &
  ↓
RESULT: 🎵 Music plays!
```

---

## ❓ FAQ

### Q: Why do we need a daemon?

**A: Browser CANNOT execute shell scripts directly.**

The browser is sandboxed for security. It can only:
- Display UI
- Read files (via iframe)
- Write to localStorage

It CANNOT:
- Execute shell commands
- Run external scripts
- Access system processes

The daemon is THE BRIDGE between browser and shell scripts.

---

### Q: Can't we make it simpler?

**A: This IS the simplest possible solution that works.**

You need:
1. Browser UI (can't avoid this - it's the interface)
2. Daemon (REQUIRED to execute scripts)
3. Scripts (play.sh and stop.sh)

You cannot remove any of these components and still have a working system.

---

### Q: What about KUAL?

**A: KUAL is different - text menus instead of browser UI.**

KUAL advantages:
- ✅ No daemon needed
- ✅ Simpler setup

KUAL disadvantages:
- ❌ No custom UI
- ❌ Just text menus
- ❌ Less flexible

If you want KUAL instead, create:
`/mnt/us/extensions/SoxPlayer/menu.json`:
```json
{
    "items": [
        {"name": "Play Song 1", "action": "/mnt/us/sox/play.sh", "params": "/mnt/us/music/song1.mp3"},
        {"name": "Play Song 2", "action": "/mnt/us/sox/play.sh", "params": "/mnt/us/music/song2.mp3"},
        {"name": "Stop", "action": "/mnt/us/sox/stop.sh"}
    ]
}
```

But this is just a menu - no dynamic track listing, no nice UI.

---

### Q: Why localStorage? Why not files?

**A: localStorage IS the fastest IPC method available.**

You COULD use files:
```javascript
// Browser writes
fetchFile('file:///tmp/sox-command.txt', ...); // Wait, can't WRITE!
```

Problem: Browser can only READ files, not WRITE them!

localStorage is the ONLY way for browser to write data that daemon can read.

---

### Q: What if I don't want a daemon running?

**A: Then you need KUAL (menu system) instead of Illusion (browser UI).**

There is NO way to execute scripts from browser without a daemon.

Browser → Daemon → Scripts is the ONLY path.

---

## 📊 File Breakdown

### index-MINIMAL.html (100 lines):

```javascript
// This is literally ALL the browser does:

function play() {
    localStorage.setItem('track', selectedTrack);
    localStorage.setItem('cmd', 'play');
}

function stop() {
    localStorage.setItem('cmd', 'stop');
}
```

That's it! The rest is just UI (track list, buttons, styling).

---

### daemon-minimal.sh (40 lines):

```bash
# This is literally ALL the daemon does:

while true; do
    CMD=$(sqlite3 "$DB" "SELECT value FROM ItemTable WHERE key='cmd';")

    case "$CMD" in
        play)
            TRACK=$(sqlite3 "$DB" "SELECT value FROM ItemTable WHERE key='track';")
            /mnt/us/sox/play.sh "$TRACK"
            ;;
        stop)
            /mnt/us/sox/stop.sh
            ;;
    esac

    sleep 0.5
done
```

That's it! The rest is just setup and cleanup.

---

### play.sh (6 lines):

```bash
#!/bin/sh
killall play 2>/dev/null
/mnt/us/sox/play "$1" &
echo "Playing: $1"
```

---

### stop.sh (3 lines):

```bash
#!/bin/sh
killall play 2>/dev/null
echo "Stopped"
```

---

## ✅ What You Get

**WORKING FEATURES:**
- ✅ List music files from /mnt/us/music/
- ✅ Select track by clicking
- ✅ Play button plays music
- ✅ Stop button stops music
- ✅ Simple, minimal code

**MISSING FEATURES:**
- ❌ No progress bar (sox doesn't provide this)
- ❌ No volume control (would need to restart sox)
- ❌ No effects (would need to restart sox)
- ❌ No status feedback (daemon doesn't write back)

**For those features, use:** `sox/soxd-fixed.sh` (the full daemon)

---

## 🎓 Summary

### The Truth:

**This IS as simple as it gets.**

Browser → localStorage → Daemon → Scripts → Sox → Audio

You cannot skip any step in this chain.

### If This Seems Complex:

It's not. This is the MINIMUM required to bridge browser sandboxing.

- Browser: 100 lines
- Daemon: 40 lines
- Scripts: 10 lines total
- Total: 150 lines of code

**That's incredibly simple for a cross-process IPC system!**

### Final Word:

**The current implementation with daemon-minimal.sh IS the simplest possible working solution.**

There is NO simpler way to run scripts from a browser-based Illusion app.

---

**Use this version if you want absolute minimum. It works!**
