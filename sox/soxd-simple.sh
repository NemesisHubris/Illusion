#!/bin/sh
# Ultra-Simple Sox Daemon
# Just listens for "play" command and runs sox

LIPC_SERVICE="com.custom.soxplayer"
LOG="/tmp/soxd-simple.log"

echo "Sox daemon starting..." | tee -a "$LOG"
echo "PID: $$" | tee -a "$LOG"

# Listen for LIPC events forever
lipc-wait-event -s 0 "$LIPC_SERVICE" \* | while read EVENT DATA; do
    echo "[$(date)] Event: $EVENT | Data: $DATA" | tee -a "$LOG"

    case "$EVENT" in
        play)
            # Extract track path from DATA
            # DATA format: {"track":"/path/to/file.mp3"}
            TRACK=$(echo "$DATA" | grep -o '"/mnt/us/music/[^"]*"' | tr -d '"')

            if [ -n "$TRACK" ]; then
                echo "Playing: $TRACK" | tee -a "$LOG"

                # Kill any existing playback
                killall play 2>/dev/null

                # Play the track
                /mnt/us/sox/play "$TRACK" &

                echo "Sox started (PID: $!)" | tee -a "$LOG"
            else
                echo "ERROR: No track in message" | tee -a "$LOG"
            fi
            ;;

        stop)
            echo "Stopping playback" | tee -a "$LOG"
            killall play 2>/dev/null
            ;;

        *)
            echo "Unknown event: $EVENT" | tee -a "$LOG"
            ;;
    esac
done
