# Sox Player - QUICK START

## 🎯 Goal: Click Play → Music Plays

This is the WORKING version using localStorage for IPC. Just 3 steps!

---

## 📦 What You Need

1. Jailbroken Kindle
2. Sox binaries at `/mnt/us/sox/play`
3. Music files at `/mnt/us/music/`

---

## 🚀 Installation (3 Steps)

### Step 1: Copy Files to Kindle

```bash
# Copy Sox daemon (RECOMMENDED: use soxd-fixed.sh)
scp sox/soxd-fixed.sh root@KINDLE_IP:/mnt/us/sox/
ssh root@KINDLE_IP "chmod +x /mnt/us/sox/soxd-fixed.sh"

# Copy Illusion app
scp -r SoxPlayerSimple/ root@KINDLE_IP:/mnt/us/documents/
scp SoxPlayerSimple.sh root@KINDLE_IP:/mnt/us/documents/
ssh root@KINDLE_IP "chmod +x /mnt/us/documents/SoxPlayerSimple.sh"
```

### Step 2: Start the Daemon

```bash
ssh root@KINDLE_IP
/mnt/us/sox/soxd-fixed.sh &

# Verify it's running
ps | grep soxd
# Should show: soxd-fixed.sh

# Monitor logs (optional)
tail -f /tmp/soxd.log
```

### Step 3: Launch the App

From your Kindle:
1. Go to Library
2. Find "Sox Player" scriptlet
3. Tap to launch

---

## 🎵 Usage

1. **Select a track** from the list (tap it)
2. **Click PLAY** button
3. **Music plays!** 🎉

To stop: Click STOP button

---

## 🐛 Troubleshooting

### "No tracks showing"
```bash
# Check music directory
ssh root@KINDLE_IP
ls /mnt/us/music/
# Add .mp3, .wav, .flac, or .ogg files
```

### "Click play does nothing"
```bash
# Check daemon is running
ssh root@KINDLE_IP
ps | grep soxd

# If not running, start it:
/mnt/us/sox/soxd-fixed.sh &

# Check daemon log:
tail -f /tmp/soxd.log
```

### "Daemon not starting"
```bash
# Check sox binary exists
ls -la /mnt/us/sox/play

# Make executable
chmod +x /mnt/us/sox/play

# Test sox directly
/mnt/us/sox/play /mnt/us/music/test.mp3
```

---

## 📖 How It Works

```
┌──────────────┐
│ Click PLAY   │
└──────┬───────┘
       │
       ▼
┌────────────────────────────┐
│ localStorage.setItem()     │
│ 'soxCommand' = 'play:...'  │
└──────┬─────────────────────┘
       │ (SQLite database)
       ▼
┌──────────────────────────┐
│ soxd-fixed.sh            │
│ (polls localStorage DB)  │
└──────┬───────────────────┘
       │
       ▼
┌─────────────────────────┐
│ /mnt/us/sox/play track │
└──────┬──────────────────┘
       │
       ▼
   🔊 AUDIO!
```

**Key Insight:**
- Browser writes to localStorage (SQLite database)
- Daemon polls the database file every 0.5 seconds
- Commands execute immediately
- No LIPC required!

---

## ✅ What Works

- ✅ Browse music files
- ✅ Select track
- ✅ Play button → Sox plays
- ✅ Stop button → Sox stops
- ✅ Multiple formats (MP3, WAV, FLAC, OGG)
- ✅ Error handling
- ✅ Status updates

---

## 🔧 Next Steps (Optional)

Once this basic version works, you can customize:

1. **Add volume control** - Restart sox with different volume
2. **Add effects** - Add reverb, echo, etc.
3. **Add playlist** - Queue multiple tracks
4. **Auto-next** - Play next track when done

But first: **Make sure Play works!**

---

## 📝 Files Created

```
/mnt/us/
├── sox/
│   ├── play                # Sox binary (you provide)
│   └── soxd-fixed.sh      # localStorage daemon (WORKS!)
├── documents/
│   ├── SoxPlayerSimple/    # Illusion app
│   │   ├── index.html      # localStorage version (WORKS!)
│   │   ├── config.xml
│   │   ├── polyfill.min.js
│   │   └── mesquito-sdk.js
│   └── SoxPlayerSimple.sh  # Scriptlet launcher
└── music/
    └── *.mp3               # Your music
```

---

## 💡 Pro Tips

1. **Auto-start daemon on boot:**
   Add to `/etc/rc.local`:
   ```bash
   /mnt/us/sox/soxd-fixed.sh &
   ```

2. **Monitor daemon:**
   ```bash
   tail -f /tmp/soxd.log
   ```

3. **Test localStorage directly:**
   ```bash
   sqlite3 /var/local/mesquite/SoxPlayerSimple/localstorage/file__0.localstorage <<EOF
   INSERT OR REPLACE INTO ItemTable VALUES ('soxCommand', 'play:/mnt/us/music/test.mp3');
   EOF
   ```

4. **Check localStorage database:**
   ```bash
   sqlite3 /var/local/mesquite/SoxPlayerSimple/localstorage/file__0.localstorage \
       "SELECT * FROM ItemTable;"
   ```

---

## ⚠️ Important Notes

### DO USE:
- ✅ `SoxPlayerSimple/index.html` (localStorage version)
- ✅ `sox/soxd-fixed.sh` (recommended daemon)
- ✅ `sox/soxd-localStorage.sh` (simpler daemon, also works)

### DO NOT USE:
- ❌ Files in `sox/BROKEN/` directory (old LIPC versions - don't work)
- ❌ `SoxPlayerSimple/index-BROKEN-LIPC.html` (broken LIPC version)

---

## 🎉 Success Looks Like:

1. Tap a track → Highlight changes (✅ Works)
2. Click PLAY → Music starts (✅ Works)
3. Check log → Shows "Command received: play" (✅ Works)
4. Click STOP → Music stops (✅ Works)

**That's it! Foundation complete!**

---

## 📚 More Information

- **README_SOX_PLAYER.md** - Complete guide with troubleshooting
- **ISSUES_FOUND.md** - All bugs found and fixed
- **DEPLOYMENT_GUIDE.md** - Detailed deployment instructions

---

**Now you can build from here:**
- Add volume slider
- Add effects
- Add playlists
- Add favorites
- Etc.

**But you have a WORKING base!** 🎵
