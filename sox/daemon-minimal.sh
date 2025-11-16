#!/bin/sh
# ABSOLUTE MINIMUM daemon - polls localStorage and runs play/stop scripts
# This is the SIMPLEST possible working solution

DB="/var/local/mesquite/SoxPlayerSimple/localstorage/file__0.localstorage"
SOX_DIR="/mnt/us/sox"

echo "[$(date)] Daemon started"
echo "[$(date)] Polling $DB every 0.5s"

while true; do
    # Wait for database to exist (created when browser loads)
    if [ ! -f "$DB" ]; then
        sleep 0.5
        continue
    fi

    # Read command from localStorage
    CMD=$(sqlite3 "$DB" "SELECT value FROM ItemTable WHERE key='soxCommand';" 2>/dev/null | head -1)

    if [ -z "$CMD" ]; then
        sleep 0.5
        continue
    fi

    # Clear command immediately
    sqlite3 "$DB" "DELETE FROM ItemTable WHERE key='soxCommand';" 2>/dev/null

    # Parse command format: "play:/path/to/file" or "stop"
    ACTION=$(echo "$CMD" | cut -d: -f1)
    PARAM=$(echo "$CMD" | cut -d: -f2-)

    # Execute command
    case "$ACTION" in
        play)
            TRACK="$PARAM"
            if [ -n "$TRACK" ]; then
                echo "[$(date)] Playing: $TRACK"
                $SOX_DIR/play.sh "$TRACK"
            fi
            ;;

        stop)
            echo "[$(date)] Stopping"
            $SOX_DIR/stop.sh
            ;;

        quit)
            echo "[$(date)] Quit received"
            exit 0
            ;;
    esac

    sleep 0.5
done
