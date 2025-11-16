#!/bin/sh
# Sox Daemon - localStorage Polling Version
# This ACTUALLY WORKS because browser CAN write to localStorage!

MUSIC_DIR="/mnt/us/music"
SOX_BIN="/mnt/us/sox/play"
PID_FILE="/tmp/soxd.pid"
LOG="/tmp/soxd.log"

# localStorage is SQLite database at:
STORAGE_DB="/var/local/mesquite/SoxPlayerSimple/localstorage/file__0.localstorage"

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "Daemon already running (PID: $OLD_PID)" | tee -a "$LOG"
        exit 1
    fi
fi

# Save our PID
echo $$ > "$PID_FILE"

log() {
    echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG"
}

log "Sox daemon started (PID: $$)"
log "Watching: $STORAGE_DB"

# Track sox process
SOX_PID=""

kill_sox() {
    if [ -n "$SOX_PID" ] && kill -0 "$SOX_PID" 2>/dev/null; then
        kill "$SOX_PID" 2>/dev/null
        wait "$SOX_PID" 2>/dev/null
        log "Killed sox (PID: $SOX_PID)"
    fi
    SOX_PID=""
}

# Read command from localStorage
read_command() {
    # Check if database exists
    if [ ! -f "$STORAGE_DB" ]; then
        return
    fi

    # Read 'command' key from localStorage
    # localStorage stores as: key='command', value='play:/path/to/file.mp3'
    CMD=$(sqlite3 "$STORAGE_DB" "SELECT value FROM ItemTable WHERE key='soxCommand';" 2>/dev/null | head -1)

    if [ -z "$CMD" ]; then
        return
    fi

    # Clear the command so we don't re-execute
    sqlite3 "$STORAGE_DB" "DELETE FROM ItemTable WHERE key='soxCommand';" 2>/dev/null

    # Parse command: "play:/path/to/file.mp3" or "stop"
    ACTION=$(echo "$CMD" | cut -d: -f1)
    PARAM=$(echo "$CMD" | cut -d: -f2-)

    log "Command: $ACTION | Param: $PARAM"

    case "$ACTION" in
        play)
            if [ -n "$PARAM" ]; then
                kill_sox
                log "Playing: $PARAM"

                "$SOX_BIN" "$PARAM" &
                SOX_PID=$!

                log "Sox started (PID: $SOX_PID)"

                # Update status in localStorage
                sqlite3 "$STORAGE_DB" "INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('soxStatus', 'playing:$PARAM');" 2>/dev/null
            fi
            ;;

        stop)
            kill_sox
            sqlite3 "$STORAGE_DB" "INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('soxStatus', 'stopped');" 2>/dev/null
            ;;

        quit)
            log "Quit command received"
            kill_sox
            rm -f "$PID_FILE"
            exit 0
            ;;
    esac
}

# Main loop - poll every 0.5 seconds
log "Starting polling loop..."

while true; do
    read_command
    sleep 0.5
done

# Cleanup on exit
trap "kill_sox; rm -f $PID_FILE; log 'Daemon stopped'" EXIT
