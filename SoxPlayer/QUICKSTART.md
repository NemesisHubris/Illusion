# Sox Audio Player - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Prepare Your Kindle Structure
```
/mnt/us/
├── documents/
│   ├── SoxPlayer/        ← Copy the entire SoxPlayer folder here
│   └── SoxPlayer.sh      ← Copy the scriptlet here
├── music/                ← Add your .mp3, .flac, .wav files here
└── sox/                  ← Place sox binaries here (sox, play)
```

### Step 2: Copy Files
1. **Via USB**: Connect Kindle, copy folders as shown above
2. **Via SSH**: Use `scp -r SoxPlayer/ root@kindle:/mnt/us/documents/`

### Step 3: Set Permissions (SSH Only)
```bash
chmod +x /mnt/us/documents/SoxPlayer.sh
chmod +x /mnt/us/sox/sox
chmod +x /mnt/us/sox/play
```

### Step 4: Launch
- From Kindle Library, run "Sox Audio Player" scriptlet
- Or via SSH: `/mnt/us/documents/SoxPlayer.sh`

---

## 🎵 Basic Usage

### Play Music
1. Tap any track in playlist to start playing
2. Use ▶⏸ button to pause/resume
3. Use ⏭ and ⏮ buttons to skip tracks

### Adjust Volume
- Tap **+** or **-** buttons
- Or tap and drag on volume bar

### Apply Effects
- **Speed**: Tap 0.75x, 1.0x, 1.25x, or 1.5x
- **Pitch**: Tap -200, -100, 0, +100, or +200
- **Effects**: Tap Reverb, Echo, Bass Boost, or Treble Boost to toggle

### Reset Everything
- Tap **"Reset Effects"** button to restore defaults

---

## 🛠 Common Tasks

### Add More Music
1. Copy files to `/mnt/us/music/`
2. In app, tap **"Refresh"** button

### Convert Format
1. Play a track (select it)
2. Tap **"Convert Format"**
3. Choose target format (MP3, WAV, FLAC, OGG)
4. Converted file saves to `/mnt/us/music/`

### Shuffle Playlist
- Tap **"Shuffle"** button to randomize order

### Enable Settings
1. Tap **"Settings"** button
2. Toggle options:
   - ☑ Auto-play next track
   - ☑ Repeat playlist
   - ☑ Show debug logs

---

## ⚡ Keyboard Shortcuts (if available)

- **Space**: Play/Pause
- **→**: Next track
- **←**: Previous track
- **↑**: Volume up
- **↓**: Volume down

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| No music files | Check `/mnt/us/music/` has audio files, tap Refresh |
| Can't launch app | Check scriptlet is executable: `chmod +x SoxPlayer.sh` |
| No sound | Test sox manually: `/mnt/us/sox/play /mnt/us/music/test.mp3` |
| Effects don't work | Ensure sox has effect support: `/mnt/us/sox/sox --help \| grep reverb` |
| Changes don't show | Tap Reload, or reboot Kindle |

---

## 📁 File Requirements

### Music Files
- **Formats**: MP3, WAV, FLAC, OGG, M4A, AAC, WMA
- **Naming**: `Artist - Title.ext` for best metadata parsing
- **Location**: `/mnt/us/music/`

### Sox Binaries
- **Required**: `sox`, `play`
- **Location**: `/mnt/us/sox/`
- **Permissions**: Must be executable (`chmod +x`)

---

## 💡 Pro Tips

1. **Better Performance**: Use MP3 files at 128-192 kbps
2. **Metadata**: Name files as "Artist - Title.mp3" for auto-parsing
3. **Debugging**: Enable "Show debug logs" in Settings
4. **Updates**: Replace files in `/mnt/us/documents/SoxPlayer/` and reload
5. **Storage**: Keep playlist under 500 tracks for best performance

---

## 🎛 Sox Command Reference

The app generates commands like this:

```bash
# Basic playback
/mnt/us/sox/play "song.mp3" vol 0.8

# With effects
/mnt/us/sox/play "song.mp3" vol 0.8 tempo 1.25 pitch 100 reverb 50

# Convert format
/mnt/us/sox/sox "input.flac" "output.mp3"
```

Test commands manually via SSH to verify sox works!

---

## 📖 Full Documentation

- **Complete Setup**: See `SOXPLAYER_SETUP.md`
- **App Features**: See `README.md` in SoxPlayer folder
- **Illusion Framework**: See main repository docs

---

**Version**: 1.0 | **Compatibility**: Jailbroken Kindle with Mesquite
