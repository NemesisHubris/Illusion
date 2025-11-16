# Sox Player - SIMPLE VERSION (Just Make It Work!)

## The Goal:
**Click Play → Sox plays music**

That's it. Start simple, build from there.

## How It Works:

```
[Play Button] → LIPC Message → [Daemon] → Sox Plays
```

## The Files:

1. **soxd-simple.sh** - Tiny daemon (20 lines)
2. **index-simple.html** - Minimal UI
3. **script-minimal.js** - Just sends LIPC

## Setup (5 Minutes):

```bash
# 1. Start daemon
/mnt/us/sox/soxd-simple.sh &

# 2. Launch Illusion app
# (from Kindle Library)

# 3. Click Play
# IT WORKS!
```

## That's The Foundation

From there, add:
- Volume control
- Track selection
- Effects
- Etc.

But first: **Make the play button work!**
