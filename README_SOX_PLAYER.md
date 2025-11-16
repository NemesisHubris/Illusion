# Sox Audio Player for Kindle - Complete Guide

## 🎯 What This Is

A **WORKING** Sox audio player for jailbroken Kindle devices using the Illusion framework.

This guide documents the **ONLY working approach** after extensive testing and debugging.

---

## ✅ What Works (And How)

### The Working Architecture:

```
┌─────────────────────────────────────┐
│  Browser (Kindle WebKit)            │
│  - Displays UI                      │
│  - Lists music files                │
│  - Writes to localStorage           │
└─────────────┬───────────────────────┘
              │ localStorage (SQLite)
              ▼
┌─────────────────────────────────────┐
│  Daemon (soxd-fixed.sh)             │
│  - Polls localStorage DB            │
│  - Reads commands                   │
│  - Controls sox process             │
└─────────────┬───────────────────────┘
              │ process execution
              ▼
┌─────────────────────────────────────┐
│  Sox Binary                         │
│  - Plays audio files                │
│  - Handles audio effects            │
└─────────────────────────────────────┘
```

### How It Actually Works:

1. **Browser writes command to localStorage:**
   ```javascript
   localStorage.setItem('soxCommand', 'play:/mnt/us/music/song.mp3');
   ```

2. **localStorage is stored as SQLite database:**
   ```
   /var/local/mesquite/SoxPlayerSimple/localstorage/file__0.localstorage
   ```

3. **Daemon polls this database every 0.5 seconds:**
   ```bash
   sqlite3 "$DB" "SELECT value FROM ItemTable WHERE key='soxCommand';"
   ```

4. **Daemon executes sox command:**
   ```bash
   /mnt/us/sox/play "/mnt/us/music/song.mp3"
   ```

5. **Music plays!** 🎵

---

## 📦 What You Get

### Working Files:

```
SoxPlayerSimple/
├── index.html              ← localStorage-based UI (WORKS!)
├── config.xml             ← App configuration
├── polyfill.min.js        ← ES5 compatibility
└── mesquito-sdk.js        ← Kindle API helpers

sox/
├── soxd-fixed.sh          ← Full-featured daemon (RECOMMENDED)
└── soxd-localStorage.sh   ← Simpler daemon (also works)

SoxPlayerSimple.sh         ← Scriptlet launcher

sox/BROKEN/                ← Old broken LIPC versions (DO NOT USE)
├── soxd-simple-LIPC.sh    ❌ BROKEN - uses custom LIPC
├── soxd-advanced-LIPC.sh  ❌ BROKEN - uses custom LIPC
└── soxd-filebased.sh      ⚠️ Works but inefficient
```

### Features That Work:

- ✅ Browse music files from `/mnt/us/music/`
- ✅ Select track
- ✅ Play button → Sox plays audio
- ✅ Stop button → Audio stops
- ✅ Multiple audio formats (MP3, WAV, FLAC, OGG)
- ✅ Status updates (playing, stopped, finished)
- ✅ Error handling (file not found, etc.)
- ✅ Process management (PID tracking, cleanup)

### Features That DON'T Work:

- ❌ Real-time progress bar (sox doesn't provide this)
- ❌ In-track seeking (would require restarting sox)
- ❌ Live volume control (requires restarting with different volume)
- ❌ Seamless effect changes (sox applies effects at startup only)
- ❌ Gapless playback (sox processes are discrete)

**Why?** Sox is a command-line tool, not a media player daemon. Each playback is a separate process.

---

## 🚀 Quick Start

### Prerequisites:

1. Jailbroken Kindle
2. SSH access to Kindle
3. Sox binaries at `/mnt/us/sox/` (compiled for Kindle ARM)
4. Music files at `/mnt/us/music/`

### Installation (3 Steps):

#### Step 1: Copy Files to Kindle

```bash
# Copy Illusion app
scp -r SoxPlayerSimple/ root@KINDLE_IP:/mnt/us/documents/
scp SoxPlayerSimple.sh root@KINDLE_IP:/mnt/us/documents/
ssh root@KINDLE_IP "chmod +x /mnt/us/documents/SoxPlayerSimple.sh"

# Copy daemon (use soxd-fixed.sh for best experience)
scp sox/soxd-fixed.sh root@KINDLE_IP:/mnt/us/sox/
ssh root@KINDLE_IP "chmod +x /mnt/us/sox/soxd-fixed.sh"
```

#### Step 2: Start the Daemon

```bash
ssh root@KINDLE_IP
/mnt/us/sox/soxd-fixed.sh &

# Verify it's running
ps | grep soxd
# Should show: soxd-fixed.sh

# Check logs
tail -f /tmp/soxd.log
```

#### Step 3: Launch the App

From your Kindle:
1. Go to Library
2. Find "Sox Player" scriptlet
3. Tap to launch
4. Select a track
5. Click PLAY
6. **Music plays!** 🎉

---

## 🐛 Troubleshooting

### "No tracks showing"

```bash
# Check music directory
ssh root@KINDLE_IP
ls /mnt/us/music/

# Add music files (.mp3, .wav, .flac, .ogg)
scp ~/Music/*.mp3 root@KINDLE_IP:/mnt/us/music/
```

### "Click Play does nothing"

```bash
# Check if daemon is running
ssh root@KINDLE_IP
ps | grep soxd

# If not running, start it:
/mnt/us/sox/soxd-fixed.sh &

# Check daemon logs for errors
tail -f /tmp/soxd.log
```

### "Daemon won't start"

```bash
# Check sox binary exists
ls -la /mnt/us/sox/play

# Make it executable
chmod +x /mnt/us/sox/play

# Test sox directly
/mnt/us/sox/play /mnt/us/music/test.mp3
# Should play audio if sox is working

# Check for existing daemon
ps | grep soxd
# If found, kill it:
kill <PID>
rm /tmp/soxd.pid
```

### "Music plays but stops immediately"

Check the log for errors:
```bash
tail -f /tmp/soxd.log
```

Common causes:
- File format not supported by sox
- Corrupted audio file
- Sox binary missing dependencies

### "localStorage database not found"

The database is created when the browser first uses localStorage. If you see this error:

1. Open the app in Kindle browser first
2. Wait for app to fully load
3. Then start the daemon

The daemon will wait until the database exists.

---

## 📖 How It REALLY Works

### Why localStorage?

**Initial Attempt:** LIPC (Lab126 Inter-Process Communication)

We tried using `kindle.messaging.sendMessage('com.custom.soxplayer', ...)` to send commands from browser to daemon.

**Why It Failed:**
- Custom LIPC service names like `com.custom.soxplayer` **DON'T WORK** on Kindle
- Only system services (e.g., `com.lab126.*`) are registered
- `lipc-wait-event` cannot listen to custom service names
- Daemon never receives messages

**Proof:** Examining `mesquito-sdk.js` shows only `com.lab126.pillow` is used for IPC.

**The Solution:** localStorage as IPC mechanism

- Browser CAN write to localStorage (standard web API)
- localStorage is stored as SQLite database on filesystem
- Daemon CAN read SQLite database directly
- **This actually works!**

### localStorage Database Format:

**Location:**
```
/var/local/mesquite/SoxPlayerSimple/localstorage/file__0.localstorage
```

**Schema:**
```sql
CREATE TABLE ItemTable (
    key TEXT PRIMARY KEY,
    value TEXT
);
```

**Commands (Browser → Daemon):**
```sql
-- Play command
INSERT OR REPLACE INTO ItemTable VALUES ('soxCommand', 'play:/mnt/us/music/song.mp3');

-- Stop command
INSERT OR REPLACE INTO ItemTable VALUES ('soxCommand', 'stop');

-- Quit daemon
INSERT OR REPLACE INTO ItemTable VALUES ('soxCommand', 'quit');
```

**Status Updates (Daemon → Browser):**
```sql
-- Playing
INSERT OR REPLACE INTO ItemTable VALUES ('soxStatus', 'playing:song.mp3');

-- Stopped
INSERT OR REPLACE INTO ItemTable VALUES ('soxStatus', 'stopped');

-- Finished
INSERT OR REPLACE INTO ItemTable VALUES ('soxStatus', 'finished');

-- Error
INSERT OR REPLACE INTO ItemTable VALUES ('soxStatus', 'error:File not found');
```

### Daemon Polling Loop:

```bash
while true; do
    # Read command from database
    CMD=$(sqlite3 "$DB" "SELECT value FROM ItemTable WHERE key='soxCommand';" 2>/dev/null)

    if [ -n "$CMD" ]; then
        # Clear command immediately (prevent re-execution)
        sqlite3 "$DB" "DELETE FROM ItemTable WHERE key='soxCommand';" 2>/dev/null

        # Execute command
        process_command "$CMD"
    fi

    sleep 0.5  # Poll every 0.5 seconds
done
```

---

## 🔧 Advanced Usage

### Auto-Start Daemon on Boot

Add to `/etc/rc.local` (before `exit 0`):
```bash
/mnt/us/sox/soxd-fixed.sh &
```

### Monitor Daemon Activity

```bash
# Watch logs in real-time
tail -f /tmp/soxd.log

# Check if daemon is alive
ps | grep soxd

# See what sox is doing
ps | grep play
```

### Manual Testing

```bash
# Test localStorage directly
sqlite3 /var/local/mesquite/SoxPlayerSimple/localstorage/file__0.localstorage <<EOF
INSERT OR REPLACE INTO ItemTable VALUES ('soxCommand', 'play:/mnt/us/music/test.mp3');
EOF

# Check daemon logs - should see "Command received"
tail -f /tmp/soxd.log
```

### Stop Daemon Cleanly

```bash
# Send quit command
sqlite3 /var/local/mesquite/SoxPlayerSimple/localstorage/file__0.localstorage <<EOF
INSERT OR REPLACE INTO ItemTable VALUES ('soxCommand', 'quit');
EOF

# Or kill it (cleanup handler will run)
kill $(cat /tmp/soxd.pid)
```

---

## 📚 Documentation

- **ISSUES_FOUND.md** - Complete audit of all bugs found and fixed
- **QUICK_START_SIMPLE.md** - Quick setup guide
- **DEPLOYMENT_GUIDE.md** - Detailed deployment instructions
- **SOX_PLAYER_REAL.md** - Original technical documentation
- **ARCHITECTURE.md** - How Kindle browser constraints work

---

## 🎓 Lessons Learned

### What Went Wrong Initially:

1. **Assumed custom LIPC services work** (they don't)
2. **Didn't verify IPC mechanism before building** (should have tested first)
3. **Created multiple versions without testing core functionality** (wasted effort)

### What Actually Works:

1. **localStorage as IPC** (reliable, works everywhere)
2. **SQLite polling** (simple, no dependencies)
3. **Specific PID tracking** (not killall)
4. **Proper error handling** (check file exists, sox binary exists, etc.)

### Golden Rule:

**Test the simplest possible version FIRST before adding features!**

---

## 💡 Future Enhancements

### Possible Additions:

1. **Playlist support** - Queue multiple tracks
2. **Volume presets** - Buttons for loud/quiet (restarts sox with different volume)
3. **Effects presets** - One-tap reverb, echo, etc. (restarts sox with effects)
4. **Track history** - Remember recently played
5. **Favorites** - Mark favorite tracks

### NOT Possible (Due to Sox Limitations):

- Real-time progress bar (sox doesn't report progress)
- Seeking within track (would need to restart sox at offset)
- Live volume slider (sox doesn't accept runtime volume changes)
- Gapless playback (each sox process is discrete)

**Remember:** Sox is a command-line tool, not a media player daemon.

---

## 🙏 Credits

- **Illusion Framework:** Penguins184
- **Sox:** Chris Bagwell and contributors
- **Testing & Debugging:** Extensive trial and error to find what ACTUALLY works!

---

## 📝 Version History

**2025-11-16 (FINAL WORKING VERSION):**
- Removed ALL broken LIPC code
- Kept ONLY localStorage approach (the only one that works)
- Moved broken files to `sox/BROKEN/` directory
- Complete audit and bug fixes in `soxd-fixed.sh`
- Updated all documentation to reflect reality
- Created comprehensive troubleshooting guide

**Previous versions:**
- Multiple LIPC-based attempts (all broken)
- See `sox/BROKEN/` directory for historical reference

---

## 🎉 Summary

### To Get Started:

1. Copy files to Kindle
2. Start daemon: `/mnt/us/sox/soxd-fixed.sh &`
3. Launch app from Kindle library
4. Select track and click Play
5. **It works!** 🎵

### If Something Doesn't Work:

1. Check daemon is running: `ps | grep soxd`
2. Check logs: `tail -f /tmp/soxd.log`
3. Test sox directly: `/mnt/us/sox/play /mnt/us/music/test.mp3`
4. Read **Troubleshooting** section above

### Remember:

- **ONLY use localStorage version** (index.html in SoxPlayerSimple/)
- **ONLY use soxd-fixed.sh or soxd-localStorage.sh** daemons
- **DON'T use LIPC versions** (in BROKEN/ directory - they don't work)

---

**Enjoy your music! 🎵**
