#!/bin/sh
# Sox Daemon - FULLY FIXED VERSION
# Uses localStorage polling - the ONLY method that actually works!

# ============================================================================
# Configuration
# ============================================================================

MUSIC_DIR="/mnt/us/music"
SOX_BIN="/mnt/us/sox/play"
PID_FILE="/tmp/soxd.pid"
LOG="/tmp/soxd.log"

# localStorage is stored as SQLite database
# Path format: /var/local/mesquite/APPNAME/localstorage/file__0.localstorage
STORAGE_DB="/var/local/mesquite/SoxPlayerSimple/localstorage/file__0.localstorage"

# ============================================================================
# Startup Checks
# ============================================================================

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE" 2>/dev/null)
    if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
        echo "ERROR: Daemon already running (PID: $OLD_PID)"
        echo "To stop it: kill $OLD_PID"
        exit 1
    fi
    # Stale PID file, remove it
    rm -f "$PID_FILE"
fi

# Check if sox binary exists and is executable
if [ ! -x "$SOX_BIN" ]; then
    echo "ERROR: Sox binary not found or not executable: $SOX_BIN"
    echo "Please install sox binaries to /mnt/us/sox/"
    exit 1
fi

# Save our PID
echo $$ > "$PID_FILE"

# ============================================================================
# Logging
# ============================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG"
}

log "=========================================="
log "Sox Daemon Starting"
log "PID: $$"
log "Sox binary: $SOX_BIN"
log "localStorage DB: $STORAGE_DB"
log "=========================================="

# ============================================================================
# Sox Process Management
# ============================================================================

SOX_PID=""

kill_sox() {
    if [ -n "$SOX_PID" ]; then
        if kill -0 "$SOX_PID" 2>/dev/null; then
            log "Stopping sox (PID: $SOX_PID)"
            kill "$SOX_PID" 2>/dev/null
            wait "$SOX_PID" 2>/dev/null
        fi
        SOX_PID=""
    fi
}

play_track() {
    local track="$1"

    if [ ! -f "$track" ]; then
        log "ERROR: File not found: $track"
        update_status "error:File not found"
        return 1
    fi

    kill_sox

    log "Playing: $track"

    # Start sox in background
    "$SOX_BIN" "$track" &
    SOX_PID=$!

    log "Sox started (PID: $SOX_PID)"

    # Update status
    update_status "playing:$(basename "$track")"

    # Monitor sox process completion (in background)
    (
        wait "$SOX_PID" 2>/dev/null
        EXIT_CODE=$?

        if [ "$EXIT_CODE" -eq 0 ]; then
            log "Track finished normally"
            update_status "finished"
        else
            log "Track stopped (exit code: $EXIT_CODE)"
            update_status "stopped"
        fi
    ) &

    return 0
}

stop_playback() {
    log "Stop requested"
    kill_sox
    update_status "stopped"
}

# ============================================================================
# localStorage Communication
# ============================================================================

update_status() {
    local status="$1"

    if [ -f "$STORAGE_DB" ]; then
        sqlite3 "$STORAGE_DB" \
            "INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('soxStatus', '$status');" \
            2>/dev/null
    fi
}

read_command() {
    # Check if database exists
    if [ ! -f "$STORAGE_DB" ]; then
        # App not started yet, wait
        return
    fi

    # Read command from localStorage
    local cmd=$(sqlite3 "$STORAGE_DB" \
        "SELECT value FROM ItemTable WHERE key='soxCommand';" \
        2>/dev/null | head -1)

    if [ -z "$cmd" ]; then
        return
    fi

    # Clear the command immediately so we don't re-execute
    sqlite3 "$STORAGE_DB" \
        "DELETE FROM ItemTable WHERE key='soxCommand';" \
        2>/dev/null

    # Parse command format: "action:parameter"
    # Examples: "play:/mnt/us/music/song.mp3", "stop", "quit"
    local action=$(echo "$cmd" | cut -d: -f1)
    local param=$(echo "$cmd" | cut -d: -f2-)

    log "Command received: $action $([ -n "$param" ] && echo "| Param: $param")"

    case "$action" in
        play)
            if [ -n "$param" ]; then
                play_track "$param"
            else
                log "ERROR: No track specified in play command"
            fi
            ;;

        stop)
            stop_playback
            ;;

        quit)
            log "Quit command received"
            stop_playback
            rm -f "$PID_FILE"
            log "Daemon shutting down"
            exit 0
            ;;

        *)
            log "WARNING: Unknown command: $action"
            ;;
    esac
}

# ============================================================================
# Cleanup Handler
# ============================================================================

cleanup() {
    log "Cleanup: Stopping sox and removing PID file"
    kill_sox
    rm -f "$PID_FILE"
    update_status "daemon_stopped"
    log "Daemon stopped"
}

trap cleanup EXIT INT TERM

# ============================================================================
# Main Loop
# ============================================================================

log "Entering main polling loop (0.5s interval)"
log "Waiting for commands from browser..."

LOOP_COUNT=0

while true; do
    read_command

    # Log heartbeat every 60 seconds
    LOOP_COUNT=$((LOOP_COUNT + 1))
    if [ $((LOOP_COUNT % 120)) -eq 0 ]; then
        log "Daemon alive (loops: $LOOP_COUNT)"
    fi

    sleep 0.5
done
