# Sox Audio Player for Kindle

A full-featured audio player for Amazon Kindle devices powered by Sox (Sound eXchange), built using the Illusion framework.

## Features

### Playback Controls
- **Play/Pause/Stop**: Full playback control
- **Next/Previous Track**: Navigate through playlist
- **Progress Bar**: Visual playback progress with seek capability
- **Volume Control**: Adjust volume from 0-100%

### Audio Effects (Powered by Sox)
- **Speed Control**: 0.75x, 1.0x, 1.25x, 1.5x playback speed
- **Pitch Shifting**: -200 to +200 cents adjustment
- **Reverb**: Add reverb effect to audio
- **Echo**: Add echo effect
- **Bass Boost**: Enhance bass frequencies (+10dB)
- **Treble Boost**: Enhance treble frequencies (+8dB)
- **Reset**: One-click reset all effects to default

### Playlist Management
- **Auto-load**: Automatically scans `/mnt/us/music/` for audio files
- **Shuffle**: Randomize playlist order
- **Clear**: Remove all tracks from playlist
- **Refresh**: Reload music files from disk
- **Visual Feedback**: Shows currently playing track

### Format Support
Supports all formats that Sox can handle:
- MP3 (`.mp3`)
- WAV (`.wav`)
- FLAC (`.flac`)
- OGG Vorbis (`.ogg`)
- M4A/AAC (`.m4a`, `.aac`)
- WMA (`.wma`)

### Advanced Features
- **Format Conversion**: Convert between audio formats
- **Auto-play Next**: Automatically play next track when current finishes
- **Repeat Mode**: Loop playlist continuously
- **Debug Console**: View detailed logging information
- **WiFi Status**: Shows current WiFi connection status
- **Clock**: Displays current time

## Installation

### Prerequisites
1. **Jailbroken Kindle** with scriptlet support
2. **Sox binaries** installed at `/mnt/us/sox/`
3. **Music files** in `/mnt/us/music/`

### Directory Structure
```
/mnt/us/
├── documents/
│   └── SoxPlayer/          # The Illusion app (copy this folder here)
│       ├── index.html
│       ├── style.css
│       ├── script.js
│       ├── config.xml
│       ├── polyfill.min.js
│       └── mesquito-sdk.js
├── music/                  # Your music files go here
│   ├── song1.mp3
│   ├── song2.flac
│   └── ...
└── sox/                    # Sox binaries
    ├── sox
    ├── play
    ├── rec
    └── ...
```

### Installation Steps

1. **Copy SoxPlayer folder** to `/mnt/us/documents/SoxPlayer/`

2. **Copy scriptlet** `SoxPlayer.sh` to `/mnt/us/documents/`

3. **Add music files** to `/mnt/us/music/`

4. **Ensure sox binaries** are at `/mnt/us/sox/`

5. **Run the scriptlet** from your Kindle's Library

6. The app will automatically launch!

## Usage

### Basic Playback
1. Launch the app from your Kindle library
2. Playlist automatically loads from `/mnt/us/music/`
3. Tap a track to play
4. Use playback controls to navigate

### Applying Effects
1. Adjust Speed, Pitch, or toggle effects (Reverb, Echo, Bass, Treble)
2. Changes apply to current and future tracks
3. Click "Reset Effects" to restore defaults

### Converting Formats
1. Select a track (start playing it)
2. Click "Convert Format"
3. Choose target format (MP3, WAV, FLAC, OGG)
4. Converted file saves to `/mnt/us/music/`

### Settings
- **Auto-play next track**: Automatically continue to next song
- **Repeat playlist**: Loop back to start when playlist ends
- **Show debug logs**: Display debug console for troubleshooting

## Sox Integration

The app uses sox command-line tools for audio processing:

### Playback Command Structure
```bash
/mnt/us/sox/play "TRACK_PATH" vol VOLUME tempo SPEED pitch PITCH [EFFECTS]
```

### Example Commands Generated

**Basic Playback (80% volume):**
```bash
/mnt/us/sox/play "/mnt/us/music/song.mp3" vol 0.8
```

**With Speed (1.25x) and Pitch (+100 cents):**
```bash
/mnt/us/sox/play "/mnt/us/music/song.mp3" vol 0.8 tempo 1.25 pitch 100
```

**With All Effects:**
```bash
/mnt/us/sox/play "/mnt/us/music/song.mp3" vol 0.8 tempo 1.25 pitch 100 reverb 50 echo 0.8 0.88 60 0.4 bass +10 treble +8
```

**Format Conversion:**
```bash
/mnt/us/sox/sox "/mnt/us/music/input.flac" "/mnt/us/music/output.mp3"
```

## Troubleshooting

### No Music Files Loading
- Verify files are in `/mnt/us/music/`
- Check file extensions are supported
- Click "Refresh" button to reload
- Enable debug logs in Settings

### Playback Issues
- Ensure sox binaries are at `/mnt/us/sox/`
- Check sox `play` command is executable: `chmod +x /mnt/us/sox/play`
- Verify audio file isn't corrupt

### App Won't Launch
- Verify `SoxPlayer.sh` is executable
- Check app was copied to `/mnt/us/documents/SoxPlayer/`
- Reboot Kindle and try again

### Updates Not Showing
- Exit and re-enter the app
- Switch to another Mesquite app and back
- Reboot Kindle if changes still don't appear

### Effects Not Working
- Ensure sox was compiled with effect support
- Test sox from command line first
- Check debug console for error messages

## Configuration

### Changing Paths
Edit `script.js` and modify the CONFIG object:

```javascript
var CONFIG = {
    musicPath: '/mnt/us/music/',      // Change music folder
    soxPath: '/mnt/us/sox/',          // Change sox folder
    soxBinary: '/mnt/us/sox/sox',     // Change sox binary path
    playBinary: '/mnt/us/sox/play',   // Change play binary path
    supportedFormats: ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac', '.wma']
};
```

### Customizing Effects
Edit effect parameters in `buildSoxCommand()` function in `script.js`:

```javascript
// Example: Increase reverb intensity
if (STATE.effects.reverb) {
    cmd += ' reverb 80';  // Changed from 50 to 80
}
```

## Technical Details

### Browser Compatibility
- Built for **WebKit 533.16** (Safari 5.0 equivalent)
- **ES5 JavaScript** only (no ES6+ features)
- No Flexbox/Grid (uses traditional CSS)
- Uses `XMLHttpRequest` instead of `fetch()`

### File Loading
Uses Mesquito SDK's `getDirectory()` function to enumerate files, with fallback to sample playlist for testing.

### Kindle API Integration
- `kindle.net.getWirelessState()` for WiFi status
- `kindle.appmgr.ongo()` for app lifecycle
- `mesquito.log()` for persistent logging

### Storage
- LocalStorage quota: 25MB
- Stores logs and settings
- Persistent cookies enabled

## Development

### Testing Without Kindle
The app includes fallback modes for testing in a desktop browser:
- Sample playlist loads automatically
- Simulated playback progress
- Mock sox command generation

### Debugging
Enable debug console in Settings to view:
- File loading events
- Playback state changes
- Sox commands being generated
- Error messages

### Customization
The app is fully customizable:
- Modify HTML structure in `index.html`
- Update styles in `style.css`
- Extend functionality in `script.js`
- Adjust permissions in `config.xml`

## Credits

- **Framework**: Illusion by Penguins184
- **Audio Processing**: Sox by Chris Bagwell and contributors
- **Development**: NemesisHubris

## License

This application is provided as-is for use on personal Kindle devices. Sox is licensed under the GNU General Public License.

## Support

For issues or questions:
- Check the Illusion documentation
- Test sox commands manually
- Enable debug logging
- Review Kindle Modding community resources

---

**Version**: 1.0
**Last Updated**: 2025-11-16
**Compatibility**: Kindle devices with Mesquite support
