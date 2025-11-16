#!/bin/sh
# Simple play script - plays audio file with sox
# Usage: ./play.sh /path/to/file.mp3

if [ -z "$1" ]; then
    echo "Usage: $0 <audio-file>"
    exit 1
fi

# Kill any existing playback
killall play 2>/dev/null

# Play the file
/mnt/us/sox/play "$1" &

echo "Playing: $1"
