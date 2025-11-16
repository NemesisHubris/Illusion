# Sox Audio Player - Complete Setup Guide

This guide walks you through setting up the Sox Audio Player on your jailbroken Kindle.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Directory Setup](#directory-setup)
3. [Installing Sox](#installing-sox)
4. [Installing the App](#installing-the-app)
5. [Adding Music](#adding-music)
6. [First Launch](#first-launch)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required
✅ **Jailbroken Kindle** with scriptlet support
✅ **SSH or USB access** to Kindle filesystem
✅ **Sox binaries** compiled for Kindle architecture (ARM)

### Recommended
- Basic command line knowledge
- File manager app (for easier navigation)
- At least 100MB free space

---

## Directory Setup

### 1. Connect to Your Kindle
Connect via USB or SSH to access the filesystem.

### 2. Create Required Directories

```bash
# Via SSH:
ssh root@192.168.X.X
mkdir -p /mnt/us/documents/SoxPlayer
mkdir -p /mnt/us/music
mkdir -p /mnt/us/sox

# Via USB:
# Create folders manually:
# - documents/SoxPlayer/
# - music/
# - sox/
```

### 3. Verify Directory Structure

```
/mnt/us/
├── documents/
│   ├── SoxPlayer/     ← App files go here
│   └── SoxPlayer.sh   ← Scriptlet goes here
├── music/             ← Your music files
└── sox/               ← Sox binaries
```

---

## Installing Sox

### Option 1: Pre-compiled Binaries (Recommended)

1. **Download Sox for ARM** (Kindle architecture)
   - Look for sox binaries compiled for ARM devices
   - Common sources: Kindle modding forums, cross-compiled builds

2. **Copy to Kindle**
   ```bash
   # Via SCP
   scp sox play rec root@192.168.X.X:/mnt/us/sox/

   # Via USB
   # Copy files to: /mnt/us/sox/
   ```

3. **Set Permissions**
   ```bash
   ssh root@192.168.X.X
   chmod +x /mnt/us/sox/sox
   chmod +x /mnt/us/sox/play
   chmod +x /mnt/us/sox/rec
   ```

4. **Test Sox**
   ```bash
   /mnt/us/sox/sox --version
   # Should output: SoX v14.X.X
   ```

### Option 2: Cross-Compile Sox

If you need to compile sox yourself:

```bash
# On a Linux machine with ARM cross-compiler
./configure --host=arm-linux-gnueabi --prefix=/usr/local
make
make install

# Copy binaries to Kindle
scp /usr/local/bin/sox root@kindle:/mnt/us/sox/
scp /usr/local/bin/play root@kindle:/mnt/us/sox/
```

### Sox Files You Need

Minimum required files in `/mnt/us/sox/`:
- `sox` - Main sox binary
- `play` - Audio playback binary
- Any required libraries (`.so` files)

---

## Installing the App

### Step 1: Copy App Files

**Via USB:**
1. Connect Kindle to computer
2. Copy entire `SoxPlayer/` folder to `documents/SoxPlayer/`
3. Copy `SoxPlayer.sh` to `documents/`

**Via SCP:**
```bash
scp -r SoxPlayer/ root@192.168.X.X:/mnt/us/documents/
scp SoxPlayer.sh root@192.168.X.X:/mnt/us/documents/
```

### Step 2: Verify App Files

SSH into Kindle and check:

```bash
ls -la /mnt/us/documents/SoxPlayer/
# Should show:
# - index.html
# - style.css
# - script.js
# - config.xml
# - polyfill.min.js
# - mesquito-sdk.js
# - README.md
```

### Step 3: Set Scriptlet Permissions

```bash
chmod +x /mnt/us/documents/SoxPlayer.sh
```

---

## Adding Music

### Supported Formats
- MP3 (`.mp3`)
- WAV (`.wav`)
- FLAC (`.flac`)
- OGG Vorbis (`.ogg`)
- M4A/AAC (`.m4a`, `.aac`)
- WMA (`.wma`)

### File Naming for Best Results

For automatic metadata parsing, use this format:
```
Artist - Title.ext
```

Examples:
- `The Beatles - Hey Jude.mp3`
- `Mozart - Symphony No. 40.flac`
- `Pink Floyd - Comfortably Numb.ogg`

### Copy Music Files

**Via USB:**
1. Connect Kindle
2. Copy music files to `music/` folder

**Via SCP:**
```bash
scp ~/Music/*.mp3 root@192.168.X.X:/mnt/us/music/
```

### Organize Music (Optional)

You can create subfolders:
```
/mnt/us/music/
├── Rock/
│   ├── song1.mp3
│   └── song2.mp3
├── Classical/
│   ├── symphony.flac
│   └── concerto.wav
└── Jazz/
    └── smooth.ogg
```

**Note:** The app currently scans only the root `/mnt/us/music/` directory. Subdirectory support can be added by modifying `loadMusicFiles()` in `script.js`.

---

## First Launch

### 1. Launch the Scriptlet

From your Kindle:
1. Go to **Library**
2. Find **Sox Audio Player** in scriptlets
3. Tap to launch

Or via SSH:
```bash
/mnt/us/documents/SoxPlayer.sh
```

### 2. What Happens

The scriptlet will:
1. ✅ Copy app to `/var/local/mesquite/SoxPlayer/`
2. ✅ Register app in `/var/local/appreg.db`
3. ✅ Launch app via LIPC

### 3. First Use

When the app opens:
1. Playlist will auto-load from `/mnt/us/music/`
2. Tap a track to start playing
3. Use controls to adjust playback
4. Experiment with effects!

---

## Troubleshooting

### App Won't Launch

**Symptom:** Nothing happens when running scriptlet

**Solutions:**
```bash
# Check scriptlet permissions
ls -l /mnt/us/documents/SoxPlayer.sh
# Should show: -rwxr-xr-x

# Make executable if needed
chmod +x /mnt/us/documents/SoxPlayer.sh

# Check app directory exists
ls -la /mnt/us/documents/SoxPlayer/

# Check database registration
sqlite3 /var/local/appreg.db "SELECT * FROM handlerIds WHERE handlerId='com.nemesishubris.soxplayer';"

# Manually launch via LIPC
lipc-set-prop com.lab126.appmgrd start app://com.nemesishubris.soxplayer
```

### No Music Files Showing

**Symptom:** Playlist shows "No music files found"

**Solutions:**
```bash
# Check music directory
ls -la /mnt/us/music/

# Check file permissions
chmod 644 /mnt/us/music/*.mp3

# Verify file formats
file /mnt/us/music/*.mp3

# Check in app: tap "Refresh" button
```

### Sox Commands Not Working

**Symptom:** Playback doesn't start or errors occur

**Solutions:**
```bash
# Test sox manually
/mnt/us/sox/play /mnt/us/music/test.mp3

# Check sox permissions
chmod +x /mnt/us/sox/*

# Verify sox can find libraries
ldd /mnt/us/sox/sox

# Test with simple command
/mnt/us/sox/sox --version
```

### Effects Don't Apply

**Symptom:** Effects buttons don't change audio

**Solutions:**
1. Check sox was compiled with effect support:
   ```bash
   /mnt/us/sox/sox --help | grep -i reverb
   ```

2. Test effect manually:
   ```bash
   /mnt/us/sox/play test.mp3 reverb 50
   ```

3. Enable debug console (Settings → Show debug logs)

### App Doesn't Update After Changes

**Symptom:** Code changes don't appear

**Solutions:**
1. **Method 1: Reload**
   - Tap "Reload" button in app

2. **Method 2: Kill Mesquite**
   - Switch to another Mesquite app
   - Switch back to Sox Player

3. **Method 3: Restart**
   ```bash
   # Reboot Kindle
   reboot
   ```

4. **Method 4: Manual Cleanup**
   ```bash
   # Remove cached version
   rm -rf /var/local/mesquite/SoxPlayer

   # Re-run scriptlet
   /mnt/us/documents/SoxPlayer.sh
   ```

### Playback Stutters or Skips

**Symptom:** Audio has gaps or stutters

**Solutions:**
- Use lower bitrate files (128-192 kbps for MP3)
- Avoid complex effect combinations
- Close other running apps
- Use simpler formats (WAV instead of FLAC)

### Out of Memory Errors

**Symptom:** App crashes or won't load large playlists

**Solutions:**
- Reduce number of music files in `/mnt/us/music/`
- Clear LocalStorage:
  ```bash
  rm -rf /var/local/mesquite/SoxPlayer/localstorage
  ```
- Disable debug logging

---

## Advanced Configuration

### Custom Sox Path

Edit `script.js` line 11-12:

```javascript
var CONFIG = {
    soxBinary: '/path/to/custom/sox',
    playBinary: '/path/to/custom/play',
    // ...
};
```

### Add Support for More Formats

Edit `script.js` line 16:

```javascript
supportedFormats: ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac', '.wma', '.opus']
```

### Subdirectory Support

Modify `loadMusicFiles()` function to recursively scan subdirectories.

### Custom Effects Presets

Add buttons in HTML and corresponding effect chains in JavaScript.

---

## Performance Tips

### 1. Optimize Music Files
- Use 128-192 kbps MP3 for best compatibility
- Convert large FLAC files to MP3 for better performance
- Keep total playlist under 500 tracks

### 2. Reduce App Footprint
- Disable debug logging when not needed
- Clear old logs from LocalStorage
- Remove unused effects from code

### 3. Kindle Settings
- Close other apps before launching
- Ensure adequate battery (>20%)
- Use WiFi off mode for better performance

---

## Example Sox Commands

### Basic Playback
```bash
/mnt/us/sox/play "/mnt/us/music/song.mp3"
```

### With Volume (50%)
```bash
/mnt/us/sox/play song.mp3 vol 0.5
```

### Speed Up 1.5x (without pitch change)
```bash
/mnt/us/sox/play song.mp3 tempo 1.5
```

### Pitch Shift +200 cents
```bash
/mnt/us/sox/play song.mp3 pitch 200
```

### Add Reverb
```bash
/mnt/us/sox/play song.mp3 reverb 50
```

### Combine Effects
```bash
/mnt/us/sox/play song.mp3 vol 0.8 tempo 1.25 pitch 100 reverb 50 bass +10
```

### Convert MP3 to WAV
```bash
/mnt/us/sox/sox input.mp3 output.wav
```

### Convert with Effect Chain
```bash
/mnt/us/sox/sox input.mp3 output.wav bass +5 treble +3
```

---

## Maintenance

### Updating the App

1. Copy new version to `/mnt/us/documents/SoxPlayer/`
2. Run scriptlet again or reboot
3. Changes will be reflected

### Backup Settings

Settings are stored in LocalStorage. To backup:

```bash
# Backup
cp -r /var/local/mesquite/SoxPlayer/localstorage ~/backup/

# Restore
cp -r ~/backup/localstorage /var/local/mesquite/SoxPlayer/
```

### Clear Cache

```bash
rm -rf /var/local/mesquite/SoxPlayer
rm -rf /var/local/mesquite/devkit/resource/appcache/com.nemesishubris.soxplayer
```

---

## Resources

- **Illusion Framework**: See main repository README
- **Sox Documentation**: http://sox.sourceforge.net/
- **Kindle Modding**: https://kindlemodding.org/
- **Mesquite API**: https://kindlemodding.org/wafs-and-mesquite/

---

## Getting Help

If you encounter issues:

1. ✅ Enable debug logs (Settings → Show debug logs)
2. ✅ Check `/var/log/messages` for system errors
3. ✅ Test sox commands manually
4. ✅ Verify file permissions
5. ✅ Review this troubleshooting guide

---

**Happy Listening! 🎵**
