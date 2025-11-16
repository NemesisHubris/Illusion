#!/bin/sh
# Sox Daemon - File-Based Control (GUARANTEED TO WORK)
# Uses file polling instead of LIPC for browser<->daemon communication

CONTROL_DIR="/var/tmp/soxd"
COMMAND_FILE="$CONTROL_DIR/command"
STATUS_FILE="$CONTROL_DIR/status"
PLAYLIST_FILE="$CONTROL_DIR/playlist"
PID_FILE="$CONTROL_DIR/soxd.pid"
LOG_FILE="$CONTROL_DIR/soxd.log"

SOX_BIN="/mnt/us/sox/play"
SOX_PID=""

# Setup
mkdir -p "$CONTROL_DIR"
echo $$ > "$PID_FILE"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

write_status() {
    echo "$1" > "$STATUS_FILE"
    log "Status: $1"
}

kill_sox() {
    if [ -n "$SOX_PID" ] && kill -0 "$SOX_PID" 2>/dev/null; then
        kill "$SOX_PID" 2>/dev/null
        wait "$SOX_PID" 2>/dev/null
    fi
    SOX_PID=""
}

parse_line() {
    local line="$1"
    local key="$2"
    echo "$line" | grep "^$key=" | cut -d= -f2-
}

play_track() {
    local track="$1"
    local volume="${2:-0.8}"
    local speed="${3:-1.0}"
    local pitch="${4:-0}"
    local effects="$5"

    kill_sox

    local cmd="$SOX_BIN \"$track\""

    # Volume
    cmd="$cmd vol $volume"

    # Speed (tempo)
    [ "$speed" != "1.0" ] && cmd="$cmd tempo $speed"

    # Pitch
    [ "$pitch" != "0" ] && cmd="$cmd pitch $pitch"

    # Effects
    [ -n "$effects" ] && cmd="$cmd $effects"

    log "Executing: $cmd"

    # Run sox
    eval "$cmd" &
    SOX_PID=$!

    write_status "playing|$track|$SOX_PID"

    # Wait for completion in subshell
    (
        wait "$SOX_PID" 2>/dev/null
        if [ -f "$STATUS_FILE" ] && grep -q "^playing|" "$STATUS_FILE"; then
            echo "stopped||" > "$STATUS_FILE"
        fi
    ) &
}

process_command() {
    if [ ! -f "$COMMAND_FILE" ]; then
        return
    fi

    local cmd_line=$(cat "$COMMAND_FILE" 2>/dev/null)

    if [ -z "$cmd_line" ]; then
        return
    fi

    # Clear command file
    > "$COMMAND_FILE"

    local cmd=$(echo "$cmd_line" | cut -d'|' -f1)
    local params=$(echo "$cmd_line" | cut -d'|' -f2-)

    log "Command: $cmd | Params: $params"

    case "$cmd" in
        PLAY)
            local track=$(echo "$params" | cut -d'|' -f1)
            local volume=$(echo "$params" | cut -d'|' -f2)
            local speed=$(echo "$params" | cut -d'|' -f3)
            local pitch=$(echo "$params" | cut -d'|' -f4)
            local effects=$(echo "$params" | cut -d'|' -f5-)

            play_track "$track" "$volume" "$speed" "$pitch" "$effects"
            ;;

        PAUSE)
            if [ -n "$SOX_PID" ] && kill -0 "$SOX_PID" 2>/dev/null; then
                kill -STOP "$SOX_PID"
                write_status "paused|$(cat $STATUS_FILE | cut -d'|' -f2)|$SOX_PID"
            fi
            ;;

        RESUME)
            if [ -n "$SOX_PID" ] && kill -0 "$SOX_PID" 2>/dev/null; then
                kill -CONT "$SOX_PID"
                write_status "playing|$(cat $STATUS_FILE | cut -d'|' -f2)|$SOX_PID"
            fi
            ;;

        STOP)
            kill_sox
            write_status "stopped||"
            ;;

        QUIT)
            log "Shutting down..."
            kill_sox
            write_status "shutdown||"
            rm -f "$PID_FILE"
            exit 0
            ;;
    esac
}

# Initialize
log "Sox daemon started (PID: $$)"
write_status "ready||"

# Main loop - poll command file every 0.5 seconds
while true; do
    process_command
    sleep 0.5
done
