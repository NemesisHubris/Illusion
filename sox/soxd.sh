#!/bin/sh
# Sox Daemon - LIPC-based Playback Control
# This daemon runs in background and controls sox via LIPC messages from Illusion app

MUSIC_DIR="/mnt/us/music"
SOX_BIN="/mnt/us/sox/play"
LIPC_NAME="com.custom.soxd"
PID_FILE="/tmp/soxd.pid"
STATE_FILE="/tmp/soxd.state"
LOG_FILE="/tmp/soxd.log"

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "Sox daemon already running (PID: $OLD_PID)"
        exit 1
    fi
fi

# Save PID
echo $$ > "$PID_FILE"

# Initialize state
echo "stopped" > "$STATE_FILE"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

send_status() {
    # Send status back to Illusion app via LIPC
    lipc-set-prop "$LIPC_NAME" status "$1" 2>/dev/null
}

kill_sox() {
    if [ -n "$SOX_PID" ] && kill -0 "$SOX_PID" 2>/dev/null; then
        kill "$SOX_PID" 2>/dev/null
        wait "$SOX_PID" 2>/dev/null
    fi
    SOX_PID=""
}

play_track() {
    local track="$1"
    local volume="${2:-0.8}"
    local speed="${3:-1.0}"
    local pitch="${4:-0}"
    local effects="$5"

    log "Playing: $track (vol:$volume speed:$speed pitch:$pitch effects:$effects)"

    # Kill any existing playback
    kill_sox

    # Build sox command
    local cmd="$SOX_BIN \"$track\" vol $volume"

    if [ "$speed" != "1.0" ]; then
        cmd="$cmd tempo $speed"
    fi

    if [ "$pitch" != "0" ]; then
        cmd="$cmd pitch $pitch"
    fi

    # Add effects if specified
    if [ -n "$effects" ]; then
        cmd="$cmd $effects"
    fi

    # Execute sox in background
    eval "$cmd" &
    SOX_PID=$!

    echo "playing" > "$STATE_FILE"
    send_status "playing:$track"

    # Wait for completion
    wait "$SOX_PID" 2>/dev/null
    STATUS=$?

    echo "stopped" > "$STATE_FILE"
    send_status "stopped"

    log "Playback finished (status: $STATUS)"
}

pause_playback() {
    if [ -n "$SOX_PID" ] && kill -0 "$SOX_PID" 2>/dev/null; then
        kill -STOP "$SOX_PID"
        echo "paused" > "$STATE_FILE"
        send_status "paused"
        log "Paused"
    fi
}

resume_playback() {
    if [ -n "$SOX_PID" ] && kill -0 "$SOX_PID" 2>/dev/null; then
        kill -CONT "$SOX_PID"
        echo "playing" > "$STATE_FILE"
        send_status "playing"
        log "Resumed"
    fi
}

stop_playback() {
    kill_sox
    echo "stopped" > "$STATE_FILE"
    send_status "stopped"
    log "Stopped"
}

# Parse JSON-like data from LIPC (simple key=value extraction)
parse_param() {
    local data="$1"
    local key="$2"
    echo "$data" | grep -o "\"$key\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | sed 's/.*"\([^"]*\)".*/\1/'
}

# Main LIPC event loop
log "Sox daemon started (PID: $$)"
send_status "ready"

# Listen for LIPC events
lipc-wait-event -s 0 "$LIPC_NAME" \* | while read EVENT DATA; do
    log "Received event: $EVENT | Data: $DATA"

    case "$EVENT" in
        play)
            TRACK=$(parse_param "$DATA" "track")
            VOLUME=$(parse_param "$DATA" "volume")
            SPEED=$(parse_param "$DATA" "speed")
            PITCH=$(parse_param "$DATA" "pitch")
            EFFECTS=$(parse_param "$DATA" "effects")

            play_track "$TRACK" "${VOLUME:-0.8}" "${SPEED:-1.0}" "${PITCH:-0}" "$EFFECTS"
            ;;

        pause)
            pause_playback
            ;;

        resume)
            resume_playback
            ;;

        stop)
            stop_playback
            ;;

        quit)
            log "Quit command received"
            stop_playback
            rm -f "$PID_FILE" "$STATE_FILE"
            send_status "shutdown"
            exit 0
            ;;

        status)
            STATE=$(cat "$STATE_FILE" 2>/dev/null || echo "unknown")
            send_status "$STATE"
            ;;

        *)
            log "Unknown event: $EVENT"
            ;;
    esac
done

# Cleanup on exit
trap "kill_sox; rm -f $PID_FILE $STATE_FILE; log 'Daemon stopped'" EXIT
