# Sox Player - Final Deployment Guide

## ✅ VERIFIED WORKING VERSION

This guide documents the **ONLY working implementation** after complete audit and bug fixes.

**Date:** 2025-11-16
**Status:** All issues resolved, ready for deployment

---

## 📋 Pre-Deployment Checklist

### Required Software on Kindle:

- [ ] Jailbroken Kindle device
- [ ] SSH access working (`ssh root@KINDLE_IP`)
- [ ] Sox binaries compiled for Kindle ARM architecture
- [ ] SQLite3 binary available (usually pre-installed)

### Required Files to Deploy:

- [ ] `SoxPlayerSimple/` directory (with index.html, config.xml, etc.)
- [ ] `SoxPlayerSimple.sh` scriptlet
- [ ] `sox/soxd-fixed.sh` daemon

---

## 🚀 Deployment Steps

### Step 1: Prepare Your Development Machine

```bash
# Clone or navigate to Illusion directory
cd /path/to/Illusion/

# Verify required files exist
ls -la SoxPlayerSimple/index.html
ls -la SoxPlayerSimple.sh
ls -la sox/soxd-fixed.sh

# Set Kindle IP address (change this to your Kindle's IP)
export KINDLE_IP="192.168.1.100"
```

### Step 2: Copy Sox Binaries (If Not Already Installed)

If sox binaries are not yet on your Kindle:

```bash
# Download or compile sox for Kindle ARM
# Example: sox 14.4.2 compiled for ARM

# Copy to Kindle
scp /path/to/sox-binaries/play root@$KINDLE_IP:/mnt/us/sox/
scp /path/to/sox-binaries/sox root@$KINDLE_IP:/mnt/us/sox/

# Make executable
ssh root@$KINDLE_IP "chmod +x /mnt/us/sox/play /mnt/us/sox/sox"

# Test sox works
ssh root@$KINDLE_IP "/mnt/us/sox/play --version"
```

### Step 3: Deploy Daemon

```bash
# Copy daemon to Kindle
scp sox/soxd-fixed.sh root@$KINDLE_IP:/mnt/us/sox/

# Make executable
ssh root@$KINDLE_IP "chmod +x /mnt/us/sox/soxd-fixed.sh"

# Verify file permissions
ssh root@$KINDLE_IP "ls -la /mnt/us/sox/soxd-fixed.sh"
```

### Step 4: Deploy Illusion App

```bash
# Copy app directory
scp -r SoxPlayerSimple/ root@$KINDLE_IP:/mnt/us/documents/

# Copy scriptlet
scp SoxPlayerSimple.sh root@$KINDLE_IP:/mnt/us/documents/

# Make scriptlet executable
ssh root@$KINDLE_IP "chmod +x /mnt/us/documents/SoxPlayerSimple.sh"

# Verify deployment
ssh root@$KINDLE_IP "ls -la /mnt/us/documents/SoxPlayerSimple/"
ssh root@$KINDLE_IP "ls -la /mnt/us/documents/SoxPlayerSimple.sh"
```

### Step 5: Add Music Files

```bash
# Create music directory if it doesn't exist
ssh root@$KINDLE_IP "mkdir -p /mnt/us/music"

# Copy music files
scp ~/Music/*.mp3 root@$KINDLE_IP:/mnt/us/music/

# Verify music files
ssh root@$KINDLE_IP "ls -la /mnt/us/music/"
```

### Step 6: Start the Daemon

```bash
# SSH into Kindle
ssh root@$KINDLE_IP

# Start daemon in background
/mnt/us/sox/soxd-fixed.sh &

# Verify daemon is running
ps | grep soxd
# Should show: /mnt/us/sox/soxd-fixed.sh

# Check daemon logs
tail -f /tmp/soxd.log
# Should show: "Sox daemon started (PID: XXXX)"
```

### Step 7: Launch App on Kindle

**From Kindle device:**

1. Press Home button
2. Navigate to Library
3. Look for "Sox Player" scriptlet
   - If not visible, wait a few minutes for library refresh
   - Or restart Kindle
4. Tap "Sox Player" to launch
5. App should load showing track list

### Step 8: Test Playback

**From the app:**

1. Tap a track in the list (should highlight)
2. Tap "PLAY" button
3. Music should start playing
4. Tap "STOP" button
5. Music should stop

**Monitor logs during testing:**
```bash
# In SSH session, watch daemon logs
tail -f /tmp/soxd.log
```

Expected log output when clicking Play:
```
[2025-11-16 21:30:15] Command: play | Param: /mnt/us/music/test.mp3
[2025-11-16 21:30:15] Playing: /mnt/us/music/test.mp3
[2025-11-16 21:30:15] Sox started (PID: 12345)
```

---

## 🔍 Post-Deployment Verification

### Verify File Structure:

```bash
ssh root@$KINDLE_IP "find /mnt/us -name 'sox*' -o -name 'SoxPlayer*' 2>/dev/null"
```

Expected output:
```
/mnt/us/sox/play
/mnt/us/sox/sox
/mnt/us/sox/soxd-fixed.sh
/mnt/us/documents/SoxPlayerSimple/
/mnt/us/documents/SoxPlayerSimple/index.html
/mnt/us/documents/SoxPlayerSimple/config.xml
/mnt/us/documents/SoxPlayerSimple/polyfill.min.js
/mnt/us/documents/SoxPlayerSimple/mesquito-sdk.js
/mnt/us/documents/SoxPlayerSimple.sh
```

### Verify Daemon Process:

```bash
ssh root@$KINDLE_IP "ps aux | grep sox"
```

Expected output:
```
root  12345  0.0  0.0   1234   567 ?  S  21:30  0:00 /bin/sh /mnt/us/sox/soxd-fixed.sh
```

### Verify localStorage Database:

```bash
# After opening the app at least once
ssh root@$KINDLE_IP "ls -la /var/local/mesquite/SoxPlayerSimple/localstorage/"
```

Expected output:
```
file__0.localstorage
```

### Test localStorage Communication:

```bash
# Manually insert a command
ssh root@$KINDLE_IP
sqlite3 /var/local/mesquite/SoxPlayerSimple/localstorage/file__0.localstorage <<EOF
INSERT OR REPLACE INTO ItemTable VALUES ('soxCommand', 'play:/mnt/us/music/test.mp3');
EOF

# Watch daemon logs - should see command received
tail -f /tmp/soxd.log
```

---

## 🐛 Troubleshooting Deployment

### Issue: "Scriptlet doesn't appear in library"

**Solution:**
```bash
# Restart Kindle framework
ssh root@$KINDLE_IP
/etc/init.d/framework restart
```

### Issue: "Daemon won't start"

**Check:** Sox binary exists and is executable
```bash
ssh root@$KINDLE_IP "ls -la /mnt/us/sox/play"
ssh root@$KINDLE_IP "/mnt/us/sox/play --version"
```

**Check:** No stale PID file
```bash
ssh root@$KINDLE_IP "rm -f /tmp/soxd.pid"
ssh root@$KINDLE_IP "/mnt/us/sox/soxd-fixed.sh &"
```

### Issue: "App loads but no tracks shown"

**Check:** Music directory exists and has files
```bash
ssh root@$KINDLE_IP "ls -la /mnt/us/music/"
```

**Check:** File permissions
```bash
ssh root@$KINDLE_IP "chmod 644 /mnt/us/music/*.mp3"
```

### Issue: "Play button does nothing"

**Check:** Daemon is running
```bash
ssh root@$KINDLE_IP "ps | grep soxd"
```

**Check:** Daemon logs for errors
```bash
ssh root@$KINDLE_IP "tail -100 /tmp/soxd.log"
```

**Check:** localStorage database exists
```bash
ssh root@$KINDLE_IP "ls -la /var/local/mesquite/SoxPlayerSimple/localstorage/file__0.localstorage"
```

### Issue: "Music plays but stops immediately"

**Check:** File format supported by sox
```bash
ssh root@$KINDLE_IP "/mnt/us/sox/play /mnt/us/music/test.mp3"
# Should play without errors
```

**Check:** Sox has required dependencies
```bash
ssh root@$KINDLE_IP "ldd /mnt/us/sox/play"
# Should show all dependencies resolved
```

---

## 🔧 Advanced Configuration

### Auto-Start Daemon on Boot

**Edit `/etc/rc.local` on Kindle:**

```bash
ssh root@$KINDLE_IP
cat >> /etc/rc.local <<'EOF'

# Start Sox daemon
/mnt/us/sox/soxd-fixed.sh &

EOF
```

**Verify:**
```bash
ssh root@$KINDLE_IP "grep sox /etc/rc.local"
```

### Custom Daemon Logging

**Edit daemon log location:**
```bash
# Edit soxd-fixed.sh on your development machine
# Change line: LOG="/tmp/soxd.log"
# To: LOG="/mnt/us/sox/soxd.log"

# Redeploy daemon
scp sox/soxd-fixed.sh root@$KINDLE_IP:/mnt/us/sox/
```

### Multiple Music Directories

**Browser code supports subdirectories:**
```bash
ssh root@$KINDLE_IP "mkdir -p /mnt/us/music/rock /mnt/us/music/jazz"
scp ~/Music/Rock/*.mp3 root@$KINDLE_IP:/mnt/us/music/rock/
scp ~/Music/Jazz/*.mp3 root@$KINDLE_IP:/mnt/us/music/jazz/
```

App will recursively list all music files.

---

## 📊 Performance Tuning

### Daemon Polling Interval

Default: 0.5 seconds

**To reduce CPU usage:**
```bash
# Edit soxd-fixed.sh line 222:
sleep 0.5
# Change to:
sleep 1
```

**Trade-off:** Slower response to Play button (1 second delay instead of 0.5)

### localStorage Database Size

Default quota: 5MB (set in config.xml)

**To increase:**
```xml
<!-- Edit SoxPlayerSimple/config.xml line 33 -->
<kindle:asset key="LocalStorageQuota" value="10485760" />
<!-- 10MB = 10485760 bytes -->
```

---

## 🔒 Security Considerations

### File Permissions

**Recommended permissions:**
```bash
# Daemon (executable by root only)
chmod 700 /mnt/us/sox/soxd-fixed.sh

# Sox binaries (executable by all)
chmod 755 /mnt/us/sox/play /mnt/us/sox/sox

# App files (readable by all)
chmod -R 644 /mnt/us/documents/SoxPlayerSimple/*
chmod 755 /mnt/us/documents/SoxPlayerSimple

# Music files (readable by all)
chmod 644 /mnt/us/music/*.mp3
```

### Daemon Safety

The daemon includes safety checks:
- ✅ Verifies sox binary exists before starting
- ✅ Prevents multiple daemon instances (PID file)
- ✅ Validates file paths before executing
- ✅ Tracks specific sox PID (no killall)
- ✅ Cleanup handler on exit

---

## 📈 Monitoring and Maintenance

### Check Daemon Health

```bash
# Daily health check script
ssh root@$KINDLE_IP <<'EOF'
if ! ps | grep -q soxd-fixed.sh; then
    echo "WARNING: Daemon not running!"
    /mnt/us/sox/soxd-fixed.sh &
    echo "Daemon restarted"
fi
EOF
```

### Log Rotation

```bash
# Prevent log from growing indefinitely
ssh root@$KINDLE_IP <<'EOF'
if [ -f /tmp/soxd.log ] && [ $(wc -c < /tmp/soxd.log) -gt 1048576 ]; then
    mv /tmp/soxd.log /tmp/soxd.log.old
    echo "[$(date)] Log rotated" > /tmp/soxd.log
fi
EOF
```

### Database Maintenance

```bash
# Compact localStorage database
ssh root@$KINDLE_IP <<'EOF'
sqlite3 /var/local/mesquite/SoxPlayerSimple/localstorage/file__0.localstorage "VACUUM;"
EOF
```

---

## 🎓 Deployment Checklist

### Before Deployment:
- [ ] Backed up Kindle (in case of issues)
- [ ] Verified sox binaries work on Kindle
- [ ] Tested SSH access
- [ ] Read troubleshooting section

### During Deployment:
- [ ] Copied all files successfully
- [ ] Set correct permissions
- [ ] Started daemon
- [ ] Verified daemon is running
- [ ] Launched app from Kindle library

### After Deployment:
- [ ] Tested Play button (works)
- [ ] Tested Stop button (works)
- [ ] Verified logs show no errors
- [ ] Tested with multiple file formats
- [ ] Documented any custom changes

### Optional Enhancements:
- [ ] Added auto-start to /etc/rc.local
- [ ] Set up log rotation
- [ ] Created health check cron job
- [ ] Organized music into subdirectories

---

## 📚 Documentation Reference

- **README_SOX_PLAYER.md** - Main guide with architecture
- **QUICK_START_SIMPLE.md** - Quick 3-step setup
- **ISSUES_FOUND.md** - Complete bug audit
- **SOX_PLAYER_REAL.md** - Technical documentation
- **ARCHITECTURE.md** - Kindle constraints

---

## 🎉 Deployment Complete!

If you followed all steps, you now have:

- ✅ Working Sox audio player on Kindle
- ✅ localStorage-based IPC (actually works!)
- ✅ Daemon with comprehensive error handling
- ✅ Clean file structure
- ✅ Complete logging and monitoring

**To use:**
1. Open Sox Player from Kindle library
2. Select a track
3. Click PLAY
4. Enjoy your music! 🎵

**To stop:**
- Click STOP button in app
- Or kill daemon: `ssh root@$KINDLE_IP "kill $(cat /tmp/soxd.pid)"`

---

## 💡 Next Steps

Now that you have a working base, consider adding:

1. **Volume Control** - Buttons to restart sox with different volume
2. **Effects** - Reverb, echo, bass boost presets
3. **Playlists** - Queue multiple tracks
4. **Favorites** - Mark and filter favorite tracks
5. **Track History** - Remember recently played

**Remember:** Always test basic functionality before adding features!

---

**Deployment guide complete. Good luck! 🎵**
