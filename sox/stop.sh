#!/bin/sh
# Simple stop script - stops all sox playback
# Usage: ./stop.sh

killall play 2>/dev/null
echo "Stopped playback"
