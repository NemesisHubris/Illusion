# Sox Audio Player - ACTUAL Architecture

## The Problem:
- Illusion apps run in Kindle browser (WebKit 533.16)
- Browser CANNOT execute shell commands
- Browser CANNOT control sox directly
- Browser CAN send LIPC messages

## The Solution:

### Component 1: Sox Daemon (soxd.sh)
Background process that:
- Runs on Kindle startup or manually
- Listens for LIPC messages via `lipc-wait-event`
- Controls sox playback (play/pause/stop/seek)
- Manages playback state

### Component 2: Illusion App
Browser-based UI that:
- Displays file browser
- Builds playlists
- Sends commands via kindle.messaging.sendMessage()
- Receives status via kindle.messaging.receiveMessage()
- NO direct sox control

## Communication Flow:
```
User clicks Play
  ↓
JavaScript: kindle.messaging.sendMessage('com.custom.soxd', 'play', {track: '/mnt/us/music/song.mp3'})
  ↓
LIPC system routes message
  ↓
soxd.sh receives via lipc-wait-event  
  ↓
soxd.sh executes: /mnt/us/sox/play /mnt/us/music/song.mp3
  ↓
soxd.sh sends status back via lipc-send-event
  ↓
Browser receives via kindle.messaging.receiveMessage()
  ↓
UI updates
```

## What's Actually Possible:

✅ Play/Pause/Stop via LIPC commands
✅ Volume control (restart sox with new volume)
✅ Effects (restart sox with new effect chain)
✅ Track switching
✅ Basic seek (restart at position)
✅ Playlist management
✅ File browsing via getDirectory()

## What's NOT Possible:

❌ Real-time progress (would need continuous polling)
❌ Seamless effect changes (requires sox restart)
❌ Sub-second seek precision
❌ Gapless playback
