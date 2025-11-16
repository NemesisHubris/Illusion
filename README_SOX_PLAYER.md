# Sox Audio Player for Kindle - Complete Guide

## 🎯 What I Built

I created **THREE versions** of a Sox audio player for Kindle, ranging from simple to complex:

### 1. ✅ SIMPLE VERSION (RECOMMENDED - START HERE)

**Location:** `SoxPlayerSimple/`

**What it does:**
- Lists music files from `/mnt/us/music/`
- Click track to select
- Click PLAY → Sox plays music
- Click STOP → Music stops

**Files:**
- `SoxPlayerSimple/` - Minimal Illusion app
- `sox/soxd-simple.sh` - 40-line daemon
- `SoxPlayerSimple.sh` - Scriptlet
- `QUICK_START_SIMPLE.md` - Quick setup guide

**Why start here:**
- Proves the concept works
- Tests LIPC communication
- Simple to debug
- Foundation for adding features

### 2. 🔧 ADVANCED VERSION (If Simple Works)

**Location:** `SoxPlayer/` with `script-v2.js`

**What it adds:**
- Volume control
- Speed/pitch adjustments
- Audio effects (reverb, echo, bass, treble)
- Playlist management
- Auto-next track
- WiFi status
- Debug console

**Files:**
- `SoxPlayer/` - Full-featured app
- `sox/soxd.sh` - Advanced daemon with effects
- Documentation in `SOX_PLAYER_REAL.md`

### 3. 📝 COMMAND GENERATOR (No Daemon Needed)

**Location:** `SoxPlayer/` with `script-simple.js`

**What it does:**
- Browses music files
- Builds sox commands
- Displays for manual copy/paste
- No playback control from browser

**Use when:**
- LIPC doesn't work on your Kindle
- Don't want to run daemon
- Just need command generation

---

## 🚀 Quick Start

### For Beginners: Start with SIMPLE VERSION

```bash
# 1. Copy to Kindle
scp -r SoxPlayerSimple/ root@KINDLE:/mnt/us/documents/
scp SoxPlayerSimple.sh root@KINDLE:/mnt/us/documents/
scp sox/soxd-simple.sh root@KINDLE:/mnt/us/sox/

# 2. SSH into Kindle
ssh root@KINDLE

# 3. Start daemon
chmod +x /mnt/us/sox/soxd-simple.sh
/mnt/us/sox/soxd-simple.sh &

# 4. Launch app from Kindle Library

# 5. Click PLAY - it works!
```

**Read:** `QUICK_START_SIMPLE.md` for detailed guide

---

## 📚 Documentation

### Getting Started
- **QUICK_START_SIMPLE.md** - 5-minute setup for simple version
- **DEPLOYMENT_GUIDE.md** - Complete guide for all versions
- **SOX_PLAYER_REAL.md** - Technical details and architecture

### Understanding Limitations
- **ARCHITECTURE.md** - How it actually works
- **CRITICAL_ISSUES.md** - What's possible vs impossible

### Development
- **SIMPLE_VERSION.md** - Simple version overview
- **VALIDATION_REPORT.md** - Original feature list (complex version)

---

## 🔧 Architecture

### How It Works (All Versions)

```
Browser (Kindle WebKit 533.16)
  ↓ Can ONLY:
  ├─ Display UI
  ├─ Read files (getDirectory)
  ├─ Store in localStorage
  └─ Send LIPC messages

  ↓ CANNOT:
  ├─ Execute shell commands
  ├─ Control processes
  ├─ Write files
  └─ Play audio natively

Therefore:

Browser → LIPC Message → Daemon → Sox → Audio
```

**Key Insight:** Browser alone is useless for playback. MUST have daemon!

---

## ✅ What Actually Works

### Simple Version:
- ✅ Play selected track
- ✅ Stop playback
- ✅ Browse music files
- ✅ LIPC communication (if supported)

### Advanced Version (If LIPC Works):
- ✅ Volume control (restarts sox)
- ✅ Effects (reverb, echo, bass, treble)
- ✅ Speed/pitch adjustment
- ✅ Playlist management
- ✅ Track navigation

### What DOESN'T Work (Any Version):
- ❌ Real-time progress bar
- ❌ Seamless effect changes
- ❌ In-track seeking
- ❌ Gapless playback
- ❌ Live volume without restart

**Why?** Sox is a command-line tool, not a media player daemon.

---

## 🐛 Troubleshooting

### Play Button Does Nothing

**Check daemon:**
```bash
ps | grep soxd
# If nothing, start it:
/mnt/us/sox/soxd-simple.sh &
```

**Check logs:**
```bash
tail -f /tmp/soxd-simple.log
```

**Test LIPC manually:**
```bash
lipc-set-prop com.custom.soxplayer play '{"track":"/mnt/us/music/test.mp3"}'
```

### LIPC Doesn't Work

**Your Kindle might not support custom LIPC services.**

**Solution:** Use Command Generator version instead
- Copy `SoxPlayer/script-simple.js` to `SoxPlayer/script.js`
- Manually run generated commands

### No Music Files

```bash
# Check directory
ls /mnt/us/music/

# Add music
scp ~/Music/*.mp3 root@KINDLE:/mnt/us/music/
```

---

## 📂 File Structure

```
/mnt/us/
├── sox/
│   ├── play                    # Sox binary (user provides)
│   ├── sox                     # Sox binary (user provides)
│   ├── soxd-simple.sh          # Simple daemon
│   └── soxd.sh                 # Advanced daemon
├── documents/
│   ├── SoxPlayerSimple/        # SIMPLE VERSION
│   │   ├── index.html
│   │   ├── config.xml
│   │   ├── polyfill.min.js
│   │   └── mesquito-sdk.js
│   ├── SoxPlayer/              # ADVANCED VERSION
│   │   ├── index.html
│   │   ├── style.css
│   │   ├── script-v2.js        # LIPC version
│   │   ├── script-simple.js    # Command generator
│   │   ├── config.xml
│   │   ├── polyfill.min.js
│   │   └── mesquito-sdk.js
│   ├── SoxPlayerSimple.sh      # Simple scriptlet
│   └── SoxPlayer.sh            # Advanced scriptlet
└── music/
    └── *.mp3                   # Your music files
```

---

## 🎓 Learning Path

### Stage 1: Prove It Works
1. Install Simple Version
2. Get Play button working
3. Understand LIPC communication

### Stage 2: Add Features
1. Add volume control
2. Add effects
3. Add playlist features

### Stage 3: Polish
1. Improve UI
2. Add error handling
3. Optimize performance

**Don't skip Stage 1!**

---

## 💡 Pro Tips

1. **Always check daemon is running:**
   ```bash
   ps | grep soxd
   ```

2. **Monitor daemon logs:**
   ```bash
   tail -f /tmp/soxd-simple.log
   ```

3. **Auto-start on boot:**
   Add to `/etc/rc.local`:
   ```bash
   /mnt/us/sox/soxd-simple.sh &
   ```

4. **Test sox directly first:**
   ```bash
   /mnt/us/sox/play /mnt/us/music/test.mp3
   ```

---

## 🙏 Credits

- **Illusion Framework:** Penguins184
- **Sox:** Chris Bagwell and contributors
- **Documentation:** Claude (with brutal honesty!)

---

## 📝 Version History

**2025-11-16:**
- Created 3 versions (Simple, Advanced, Command Generator)
- SIMPLE version is recommended starting point
- Comprehensive documentation
- Honest about limitations

---

## 🎉 Final Notes

**Start with SIMPLE version!**
- Get Play button working FIRST
- Then build from there
- Don't overcomplicate at start

**Remember:**
- Browser needs daemon to control Sox
- LIPC might not work on all Kindles
- Always have Command Generator fallback

**Most Important:**
- Test each step
- Read the logs
- Start simple, build up

---

**Good luck! 🎵**

**Questions?** Check the documentation files:
- `QUICK_START_SIMPLE.md`
- `DEPLOYMENT_GUIDE.md`
- `SOX_PLAYER_REAL.md`
