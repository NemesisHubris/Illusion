# Sox Audio Player - Complete Deployment Guide

## ⚠️ READ THIS FIRST - BRUTAL HONESTY

The Kindle browser **CANNOT** execute shell commands or control processes. Therefore:

❌ **Browser alone CANNOT control playback**
❌ **Browser alone CANNOT run sox**
❌ **Browser alone CANNOT do anything except show a UI**

To ACTUALLY play audio, you need one of these approaches:

## 📦 Three Versions - Choose Wisely

### Version 1: LIPC Daemon (Full Control - EXPERIMENTAL)

**What you get:**
- Full playback control from browser
- Real play/pause/stop
- Volume and effect changes

**Requirements:**
- Custom LIPC services must work on your Kindle
- Background daemon must stay running
- More complex setup

**Files:**
- `SoxPlayer/index.html` (UI)
- `SoxPlayer/script-v2.js` (LIPC communication)
- `sox/soxd.sh` (daemon)

**Status:** ⚠️ **EXPERIMENTAL** - LIPC custom services might not work on all Kindles

---

### Version 2: Command Generator (Simple - ALWAYS WORKS)

**What you get:**
- Browse music files
- Build playlists
- Generate sox commands
- Copy and run manually

**Requirements:**
- Just the Illusion app
- SSH access to run commands

**Files:**
- `SoxPlayer/index.html` (UI)
- `SoxPlayer/script-simple.js` (command generator)

**Status:** ✅ **GUARANTEED TO WORK** - No assumptions about Kindle

---

### Version 3: File-Based Daemon (INCOMPLETE)

**Status:** ❌ **DOESN'T WORK** - Browser can't write files for IPC

---

## 🚀 Installation

### Step 1: Choose Your Version

**For experimentation:** Use Version 1 (LIPC Daemon)
**For reliability:** Use Version 2 (Command Generator)

### Step 2: Prepare Directory Structure

```bash
/mnt/us/
├── documents/
│   ├── SoxPlayer/        # Illusion app
│   └── SoxPlayer.sh      # Scriptlet
├── music/                # Your music files
└── sox/                  # Sox binaries + daemon
    ├── play              # Sox play binary
    ├── sox               # Sox binary
    ├── rec               # Sox record binary
    └── soxd.sh           # Daemon (Version 1 only)
```

### Step 3: Install Sox Binaries

```bash
# Copy sox to Kindle
scp -r sox/ root@KINDLE_IP:/mnt/us/

# Make executable
ssh root@KINDLE_IP
chmod +x /mnt/us/sox/*
```

**Test sox:**
```bash
/mnt/us/sox/play /mnt/us/music/test.mp3
```

### Step 4: Install Illusion App

**Version 1 (LIPC Daemon):**
```bash
# Use script-v2.js
cd SoxPlayer
cp script-v2.js script.js

# Copy to Kindle
scp -r ../SoxPlayer root@KINDLE_IP:/mnt/us/documents/
scp ../SoxPlayer.sh root@KINDLE_IP:/mnt/us/documents/
```

**Version 2 (Command Generator):**
```bash
# Use script-simple.js
cd SoxPlayer
cp script-simple.js script.js

# Copy to Kindle (no daemon needed)
scp -r ../SoxPlayer root@KINDLE_IP:/mnt/us/documents/
scp ../SoxPlayer.sh root@KINDLE_IP:/mnt/us/documents/
```

### Step 5: Add Music

```bash
scp ~/Music/*.mp3 root@KINDLE_IP:/mnt/us/music/
```

### Step 6: Launch

**Version 1 (LIPC) - Start Daemon First:**
```bash
ssh root@KINDLE_IP
/mnt/us/sox/soxd.sh &

# Verify running
ps | grep soxd
cat /tmp/soxd.log
```

**Then launch app from Kindle Library → SoxPlayer**

**Version 2 (Simple) - Just Launch:**
Run SoxPlayer from Kindle Library

---

## 📖 Usage

### Version 1: LIPC Daemon

1. **Ensure daemon is running:**
   ```bash
   ps | grep soxd
   ```

2. **Launch SoxPlayer app**

3. **Use normally:**
   - Tap track to play
   - Use Play/Pause/Stop buttons
   - Adjust volume (restarts playback)
   - Apply effects (restarts playback)

4. **Monitor daemon:**
   ```bash
   tail -f /tmp/soxd.log
   ```

5. **Stop daemon when done:**
   ```bash
   kill $(cat /tmp/soxd.pid)
   ```

**Limitations:**
- Volume changes restart playback
- Effects changes restart playback
- No progress bar (would require continuous polling)
- No seek within track
- Small gaps between tracks

### Version 2: Command Generator

1. **Launch SoxPlayer app**

2. **Browse and select track**

3. **Adjust volume/effects** (updates command)

4. **Copy generated command** from display

5. **SSH into Kindle and run:**
   ```bash
   ssh root@KINDLE_IP
   /mnt/us/sox/play "/mnt/us/music/song.mp3" vol 0.8
   ```

6. **Repeat for each track**

**Limitations:**
- Manual execution required
- No automatic next track
- No playlist automation
- But it ALWAYS works!

---

## 🐛 Troubleshooting

### Daemon not starting (Version 1)

**Check logs:**
```bash
cat /tmp/soxd.log
```

**Common issues:**
- Sox binary not found: Check `/mnt/us/sox/play` exists
- Permission denied: Run `chmod +x /mnt/us/sox/*`
- Already running: Check `ps | grep soxd`

### LIPC messages not working (Version 1)

**Test LIPC manually:**
```bash
# Send test message
lipc-set-prop com.custom.soxd play '{"track":"/mnt/us/music/test.mp3"}'

# Listen for events
lipc-wait-event -s 5 com.custom.soxd status
```

**If LIPC doesn't work:**
- Your Kindle firmware might restrict custom LIPC services
- **Solution:** Use Version 2 (Command Generator) instead

### No music files showing

**Check directory:**
```bash
ls -la /mnt/us/music/
```

**Check formats:**
Supported: `.mp3`, `.wav`, `.flac`, `.ogg`, `.m4a`, `.aac`, `.wma`

**In app:**
- Tap "Refresh" button
- Check browser console for errors

### Sox commands don't work

**Test directly:**
```bash
/mnt/us/sox/play --version
/mnt/us/sox/play /mnt/us/music/test.mp3
```

**Common issues:**
- Wrong architecture: Sox must be compiled for Kindle (ARM)
- Missing libraries: Run `ldd /mnt/us/sox/play` to check
- File permissions: Run `chmod +x /mnt/us/sox/play`

---

## 🔧 Advanced Configuration

### Auto-start Daemon on Boot (Version 1)

Add to `/etc/rc.local` or init script:
```bash
/mnt/us/sox/soxd.sh &
```

### Change Music Directory

Edit `script.js` (or `script-v2.js`/`script-simple.js`):
```javascript
var CONFIG = {
    musicPath: 'file:///mnt/us/music/',  // Change this
    // ...
};
```

### Add More Effects

Edit daemon `soxd.sh` or commands in JavaScript to add more sox effects:
```bash
flanger       # Flanger effect
phaser        # Phaser effect
chorus        # Chorus effect
compand       # Dynamic range compression
equalizer     # Equalizer
```

See `sox --help` for all available effects.

---

## ✅ What Actually Works

**Both Versions:**
- ✅ File browsing via `getDirectory()`
- ✅ Playlist building
- ✅ Effect chain generation
- ✅ Format support (whatever sox supports)
- ✅ Settings in localStorage

**Version 1 Only:**
- ✅ Play/Pause/Stop from browser
- ✅ Track switching
- ✅ Volume control (with restart)
- ✅ Effects (with restart)

---

## ❌ What Doesn't Work

**Impossible with browser alone:**
- ❌ Real-time progress tracking
- ❌ Seamless effect changes
- ❌ In-track seeking
- ❌ Gapless playback
- ❌ Native audio playback

**Why?**
- Kindle browser can't execute shell commands
- Kindle browser can't query process state
- Sox doesn't support live parameter changes
- Sox doesn't report playback progress

---

## 🎯 Honest Recommendations

**For learning/experimentation:**
- Try Version 1 (LIPC Daemon)
- Learn about Kindle limitations
- Understand IPC concepts

**For actual music playback:**
- Use Version 2 (Command Generator) for simplicity
- OR use SSH + sox directly (most reliable)
- OR install proper music daemon (MPD, etc.)
- OR use Audible/Kindle's built-in features

**This app is:**
- ✅ Educational
- ✅ Proof-of-concept
- ✅ File browser/organizer
- ❌ NOT a polished music player
- ❌ NOT as good as native solutions

---

## 📝 Technical Details

### How Version 1 Works (LIPC)

```
Browser → kindle.messaging.sendMessage()
   ↓
LIPC System Routes Message
   ↓
Daemon (lipc-wait-event) Receives
   ↓
Daemon Executes: /mnt/us/sox/play ...
   ↓
Audio Output
```

### How Version 2 Works (Simple)

```
Browser → Reads files via getDirectory()
   ↓
Browser → Generates command string
   ↓
Browser → Displays command
   ↓
User → Copies and runs via SSH
   ↓
Sox → Audio Output
```

### Why File-Based IPC Doesn't Work

```
Browser needs to write → /var/tmp/soxd/command
   ↓
BUT Browser has NO file write capability!
   ↓
Only localStorage (SQLite database)
   ↓
Daemon would need SQLite queries
   ↓
Too complex, not worth it
```

---

## 📚 Further Reading

- **Illusion Documentation:** See main repo
- **Sox Manual:** `man sox` or http://sox.sourceforge.net/
- **LIPC Documentation:** KindleModding wiki
- **Kindle Limitations:** WebKit 533.16 (Safari 5.0)

---

## 🙏 Credits

- **Illusion Framework:** Penguins184
- **Sox:** Chris Bagwell and contributors
- **Brutal Honesty:** Claude (that's me!)

---

**Last Updated:** 2025-11-16
**Status:** Fully documented with realistic expectations
**Recommendation:** Use as learning tool or simple file browser
