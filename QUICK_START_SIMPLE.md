# Sox Player - QUICK START (Simple Version)

## 🎯 Goal: Click Play → Music Plays

This is the SIMPLEST working version. Just 3 steps!

---

## 📦 What You Need

1. Jailbroken Kindle
2. Sox binaries at `/mnt/us/sox/`
3. Music files at `/mnt/us/music/`

---

## 🚀 Installation (3 Steps)

### Step 1: Copy Files to Kindle

```bash
# Copy Sox daemon
scp sox/soxd-simple.sh root@KINDLE_IP:/mnt/us/sox/
ssh root@KINDLE_IP "chmod +x /mnt/us/sox/soxd-simple.sh"

# Copy Illusion app
scp -r SoxPlayerSimple/ root@KINDLE_IP:/mnt/us/documents/
scp SoxPlayerSimple.sh root@KINDLE_IP:/mnt/us/documents/
ssh root@KINDLE_IP "chmod +x /mnt/us/documents/SoxPlayerSimple.sh"
```

### Step 2: Start the Daemon

```bash
ssh root@KINDLE_IP
/mnt/us/sox/soxd-simple.sh &

# Verify it's running
ps | grep soxd
# Should show: soxd-simple.sh
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
/mnt/us/sox/soxd-simple.sh &

# Check daemon log:
tail -f /tmp/soxd-simple.log
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
┌─────────────────────────────────┐
│ kindle.messaging.sendMessage()  │
│ → com.custom.soxplayer          │
└──────┬──────────────────────────┘
       │ (LIPC)
       ▼
┌──────────────────────────┐
│ soxd-simple.sh           │
│ (lipc-wait-event)        │
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

---

## ✅ What Works

- ✅ Browse music files
- ✅ Select track
- ✅ Play button → Sox plays
- ✅ Stop button → Sox stops

---

## 🔧 Next Steps (Optional)

Once this basic version works, you can add:

1. **Volume control** - Restart sox with different volume
2. **Effects** - Add reverb, echo, etc.
3. **Next/Previous** - Playlist navigation
4. **Auto-next** - Play next track when done

But first: **Make sure Play works!**

---

## 📝 Files Created

```
/mnt/us/
├── sox/
│   ├── play                # Sox binary (you provide)
│   └── soxd-simple.sh      # Simple daemon (40 lines)
├── documents/
│   ├── SoxPlayerSimple/    # Illusion app
│   │   ├── index.html
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
   /mnt/us/sox/soxd-simple.sh &
   ```

2. **Monitor daemon:**
   ```bash
   tail -f /tmp/soxd-simple.log
   ```

3. **Test LIPC directly:**
   ```bash
   lipc-set-prop com.custom.soxplayer play '{"track":"/mnt/us/music/test.mp3"}'
   ```

---

## 🎉 Success Looks Like:

1. Tap a track → Highlight changes (✅ Works)
2. Click PLAY → Music starts (✅ Works)
3. Click STOP → Music stops (✅ Works)

**That's it! Foundation complete!**

---

**Now you can build from here:**
- Add volume slider
- Add effects
- Add playlists
- Etc.

**But you have a WORKING base!**
