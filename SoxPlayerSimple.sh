#!/bin/sh
# Sox Player - Simple Version

SOURCE_DIR="/mnt/us/documents/SoxPlayerSimple"
TARGET_DIR="/var/local/mesquite/SoxPlayerSimple"
DB="/var/local/appreg.db"
APP_ID="com.custom.soxplayer"

# Copy app
if [ -d "$SOURCE_DIR" ]; then
    [ -d "$TARGET_DIR" ] && rm -rf "$TARGET_DIR"
    cp -r "$SOURCE_DIR" "$TARGET_DIR"
else
    exit 1
fi

# Register app
sqlite3 "$DB" <<EOF
INSERT OR IGNORE INTO interfaces(interface) VALUES('application');
INSERT OR IGNORE INTO handlerIds(handlerId) VALUES('$APP_ID');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$APP_ID','lipcId','$APP_ID');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$APP_ID','command','/usr/bin/mesquite -l $APP_ID -c file://$TARGET_DIR/');
INSERT OR REPLACE INTO properties(handlerId,name,value) VALUES('$APP_ID','supportedOrientation','U');
EOF

echo "Registered $APP_ID"
sleep 2

# Launch
nohup lipc-set-prop com.lab126.appmgrd start app://$APP_ID >/dev/null 2>&1 &
