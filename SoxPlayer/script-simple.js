// Sox Audio Player - SIMPLE COMMAND GENERATOR
// This version is GUARANTEED to work - it just generates commands
// No daemons, no LIPC, no impossible features
// BRUTAL HONESTY: You must manually run the generated commands

(function() {
    'use strict';

    var CONFIG = {
        musicPath: 'file:///mnt/us/music/',
        soxPath: '/mnt/us/sox/',
        supportedFormats: ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac', '.wma']
    };

    var STATE = {
        playlist: [],
        selectedTrack: null,
        volume: 80,
        speed: 1.0,
        pitch: 0,
        effects: {
            reverb: false,
            echo: false,
            bass: false,
            treble: false
        }
    };

    // ========================================
    // Utility Functions
    // ========================================
    function log(message) {
        var output = document.getElementById('command-output');
        if (output) {
            var entry = document.createElement('div');
            entry.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message;
            output.appendChild(entry);
            if (output.children.length > 50) {
                output.removeChild(output.firstChild);
            }
            output.scrollTop = output.scrollHeight;
        }
    }

    function getFileExtension(filename) {
        var parts = filename.split('.');
        return parts.length > 1 ? '.' + parts[parts.length - 1].toLowerCase() : '';
    }

    function parseTrackName(filename) {
        var name = filename.replace(/\.[^/.]+$/, '');
        var parts = name.split(' - ');
        if (parts.length === 2) {
            return {artist: parts[0].trim(), title: parts[1].trim()};
        }
        return {artist: 'Unknown', title: name};
    }

    // ========================================
    // Sox Command Generation
    // ========================================
    function generatePlayCommand(track) {
        if (!track) {
            return '';
        }

        var cmd = CONFIG.soxPath + 'play "' + CONFIG.musicPath.replace('file:///', '/') + track.filename + '"';

        // Volume
        var vol = (STATE.volume / 100).toFixed(2);
        cmd += ' vol ' + vol;

        // Speed
        if (STATE.speed !== 1.0) {
            cmd += ' tempo ' + STATE.speed;
        }

        // Pitch
        if (STATE.pitch !== 0) {
            cmd += ' pitch ' + STATE.pitch;
        }

        // Effects
        if (STATE.effects.reverb) cmd += ' reverb 50';
        if (STATE.effects.echo) cmd += ' echo 0.8 0.88 60 0.4';
        if (STATE.effects.bass) cmd += ' bass +10';
        if (STATE.effects.treble) cmd += ' treble +8';

        return cmd;
    }

    function displayCommand(cmd) {
        var cmdDisplay = document.getElementById('current-command');
        cmdDisplay.textContent = cmd;

        log('Generated command:');
        log(cmd);
        log('');
        log('To play this track:');
        log('1. SSH into your Kindle');
        log('2. Copy and paste the command above');
        log('3. Press Enter');
        log('');
    }

    // ========================================
    // File Loading
    // ========================================
    function loadMusicFiles() {
        log('Loading music files from: ' + CONFIG.musicPath);

        if (typeof getDirectory !== 'function') {
            log('ERROR: getDirectory not available');
            log('Loading demo files for testing...');
            loadDemoFiles();
            return;
        }

        getDirectory(CONFIG.musicPath).then(function(files) {
            log('Found ' + files.length + ' files');
            processMusicFiles(files);
        }).catch(function(error) {
            log('ERROR: ' + error);
            log('Loading demo files...');
            loadDemoFiles();
        });
    }

    function loadDemoFiles() {
        processMusicFiles([
            {name: 'Demo - Track 01.mp3', path: '/mnt/us/music/Demo - Track 01.mp3'},
            {name: 'Demo - Track 02.flac', path: '/mnt/us/music/Demo - Track 02.flac'},
            {name: 'Demo - Track 03.ogg', path: '/mnt/us/music/Demo - Track 03.ogg'}
        ]);
    }

    function processMusicFiles(files) {
        STATE.playlist = [];

        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var ext = getFileExtension(file.name);

            if (CONFIG.supportedFormats.indexOf(ext) !== -1) {
                var info = parseTrackName(file.name);
                STATE.playlist.push({
                    filename: file.name,
                    artist: info.artist,
                    title: info.title,
                    format: ext.substring(1).toUpperCase()
                });
            }
        }

        log('Loaded ' + STATE.playlist.length + ' music files');
        updatePlaylistUI();
    }

    // ========================================
    // UI Updates
    // ========================================
    function updatePlaylistUI() {
        var playlistEl = document.getElementById('playlist');
        var countEl = document.getElementById('playlist-count');

        playlistEl.innerHTML = '';
        countEl.textContent = STATE.playlist.length + ' track' + (STATE.playlist.length === 1 ? '' : 's');

        if (STATE.playlist.length === 0) {
            playlistEl.innerHTML = '<div class="playlist-item loading">No music files found</div>';
            return;
        }

        for (var i = 0; i < STATE.playlist.length; i++) {
            var track = STATE.playlist[i];
            var item = document.createElement('div');
            item.className = 'playlist-item';
            item.setAttribute('data-index', i);

            if (STATE.selectedTrack && STATE.selectedTrack.filename === track.filename) {
                item.className += ' active';
            }

            item.innerHTML = '<span class="track-name">' + track.title + '</span><br>' +
                           '<span class="track-details">' + track.artist + ' • ' + track.format + '</span>';

            playlistEl.appendChild(item);
        }
    }

    function updateVolumeUI() {
        document.getElementById('volume-fill').style.width = STATE.volume + '%';
        document.getElementById('volume-value').textContent = STATE.volume + '%';

        if (STATE.selectedTrack) {
            displayCommand(generatePlayCommand(STATE.selectedTrack));
        }
    }

    function updateEffectsUI() {
        if (STATE.selectedTrack) {
            displayCommand(generatePlayCommand(STATE.selectedTrack));
        }
    }

    // ========================================
    // Event Handlers
    // ========================================
    function initializeEventListeners() {
        // Volume controls
        document.getElementById('vol-up').addEventListener('click', function() {
            STATE.volume = Math.min(100, STATE.volume + 10);
            updateVolumeUI();
        });

        document.getElementById('vol-down').addEventListener('click', function() {
            STATE.volume = Math.max(0, STATE.volume - 10);
            updateVolumeUI();
        });

        // Speed controls
        var speedBtns = document.querySelectorAll('[data-speed]');
        for (var i = 0; i < speedBtns.length; i++) {
            speedBtns[i].addEventListener('click', function() {
                var allBtns = document.querySelectorAll('[data-speed]');
                for (var j = 0; j < allBtns.length; j++) {
                    allBtns[j].className = 'effect-btn';
                }
                this.className = 'effect-btn active';
                STATE.speed = parseFloat(this.getAttribute('data-speed'));
                updateEffectsUI();
            });
        }

        // Pitch controls
        var pitchBtns = document.querySelectorAll('[data-pitch]');
        for (var i = 0; i < pitchBtns.length; i++) {
            pitchBtns[i].addEventListener('click', function() {
                var allBtns = document.querySelectorAll('[data-pitch]');
                for (var j = 0; j < allBtns.length; j++) {
                    allBtns[j].className = 'effect-btn';
                }
                this.className = 'effect-btn active';
                STATE.pitch = parseInt(this.getAttribute('data-pitch'));
                updateEffectsUI();
            });
        }

        // Effect toggles
        ['reverb', 'echo', 'bass', 'treble'].forEach(function(effect) {
            document.getElementById(effect + '-btn').addEventListener('click', function() {
                STATE.effects[effect] = !STATE.effects[effect];
                this.className = STATE.effects[effect] ? 'toggle-btn active' : 'toggle-btn';
                updateEffectsUI();
            });
        });

        // Reset effects
        document.getElementById('reset-effects').addEventListener('click', function() {
            STATE.speed = 1.0;
            STATE.pitch = 0;
            STATE.effects = {reverb: false, echo: false, bass: false, treble: false};

            document.querySelectorAll('[data-speed]').forEach(function(btn) {
                btn.className = btn.getAttribute('data-speed') === '1.0' ? 'effect-btn active' : 'effect-btn';
            });

            document.querySelectorAll('[data-pitch]').forEach(function(btn) {
                btn.className = btn.getAttribute('data-pitch') === '0' ? 'effect-btn active' : 'effect-btn';
            });

            ['reverb', 'echo', 'bass', 'treble'].forEach(function(effect) {
                document.getElementById(effect + '-btn').className = 'toggle-btn';
            });

            updateEffectsUI();
        });

        // Playlist controls
        document.getElementById('refresh-btn').addEventListener('click', loadMusicFiles);

        document.getElementById('shuffle-btn').addEventListener('click', function() {
            for (var i = STATE.playlist.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = STATE.playlist[i];
                STATE.playlist[i] = STATE.playlist[j];
                STATE.playlist[j] = temp;
            }
            updatePlaylistUI();
            log('Playlist shuffled');
        });

        // Playlist item clicks
        document.getElementById('playlist').addEventListener('click', function(e) {
            var item = e.target;
            while (item && !item.getAttribute('data-index')) {
                item = item.parentNode;
            }
            if (item && item.getAttribute('data-index')) {
                var index = parseInt(item.getAttribute('data-index'));
                STATE.selectedTrack = STATE.playlist[index];
                updatePlaylistUI();

                var cmd = generatePlayCommand(STATE.selectedTrack);
                displayCommand(cmd);

                log('Selected: ' + STATE.selectedTrack.title);
                log('');
            }
        });

        // Copy command button
        document.getElementById('copy-cmd').addEventListener('click', function() {
            var cmdText = document.getElementById('current-command').textContent;
            if (!cmdText) {
                alert('No command generated. Select a track first.');
                return;
            }

            // Try to copy to clipboard (might not work on Kindle)
            try {
                var textarea = document.createElement('textarea');
                textarea.value = cmdText;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                log('Command copied to clipboard!');
                alert('Command copied to clipboard!');
            } catch (e) {
                log('Copy failed: ' + e.message);
                alert('Could not copy. Please select and copy manually.');
            }
        });

        // Reload button
        document.getElementById('reload-btn').addEventListener('click', function() {
            window.location.reload();
        });

        // Clear log
        document.getElementById('clear-log').addEventListener('click', function() {
            document.getElementById('command-output').innerHTML = '';
        });
    }

    // ========================================
    // Initialization
    // ========================================
    function initialize() {
        log('='.repeat(50));
        log('Sox Command Generator - Simple Version');
        log('='.repeat(50));
        log('');
        log('This app does NOT control playback.');
        log('It GENERATES sox commands for you to run manually.');
        log('');
        log('How to use:');
        log('1. Select a track from the playlist');
        log('2. Adjust volume/effects as desired');
        log('3. Copy the generated command');
        log('4. SSH into Kindle and run the command');
        log('');
        log('='.repeat(50));
        log('');

        initializeEventListeners();
        updateVolumeUI();
        loadMusicFiles();

        log('Initialization complete');
        log('Ready to generate commands!');
        log('');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
