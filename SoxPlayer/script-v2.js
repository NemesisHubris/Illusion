// Sox Audio Player - REAL LIPC-Based Control
// This version ACTUALLY works via LIPC daemon communication

(function() {
    'use strict';

    // ========================================
    // Configuration
    // ========================================
    var CONFIG = {
        musicPath: 'file:///mnt/us/music/',
        soxdService: 'com.custom.soxd',
        supportedFormats: ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac', '.wma'],
        statusPollInterval: 2000  // Poll status every 2 seconds
    };

    var STATE = {
        playlist: [],
        currentTrackIndex: -1,
        playbackState: 'stopped',  // stopped, playing, paused
        currentTrack: null,
        volume: 80,
        speed: 1.0,
        pitch: 0,
        effects: {
            reverb: false,
            echo: false,
            bass: false,
            treble: false
        },
        settings: {
            autoNext: true,
            repeat: false,
            showLogs: false
        }
    };

    // ========================================
    // Utility Functions
    // ========================================
    function log(message) {
        if (STATE.settings.showLogs) {
            var output = document.getElementById('debug-output');
            if (output) {
                var entry = document.createElement('div');
                entry.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message;
                output.appendChild(entry);
                if (output.children.length > 100) {
                    output.removeChild(output.firstChild);
                }
                output.scrollTop = output.scrollHeight;
            }
        }
        if (window.mesquito && window.mesquito.log) {
            window.mesquito.log(message);
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

    function buildEffectsString() {
        var effects = [];
        if (STATE.effects.reverb) effects.push('reverb 50');
        if (STATE.effects.echo) effects.push('echo 0.8 0.88 60 0.4');
        if (STATE.effects.bass) effects.push('bass +10');
        if (STATE.effects.treble) effects.push('treble +8');
        return effects.join(' ');
    }

    // ========================================
    // LIPC Communication (THE REAL STUFF)
    // ========================================
    function sendDaemonCommand(command, params) {
        if (typeof kindle === 'undefined' || !kindle.messaging) {
            log('ERROR: Kindle messaging not available');
            alert('Kindle messaging API not available. Are you running on a Kindle?');
            return false;
        }

        try {
            // Send LIPC message to sox daemon
            kindle.messaging.sendMessage(CONFIG.soxdService, command, params || {});
            log('Sent to daemon: ' + command + ' | ' + JSON.stringify(params));
            return true;
        } catch (e) {
            log('ERROR sending LIPC: ' + e.message);
            alert('Failed to send command to daemon: ' + e.message);
            return false;
        }
    }

    function setupStatusListener() {
        if (typeof kindle === 'undefined' || !kindle.messaging) {
            return;
        }

        // Listen for status updates from daemon
        kindle.messaging.receiveMessage('soxdStatus', function(msgType, data) {
            log('Received status: ' + JSON.stringify(data));

            if (data && data.state) {
                STATE.playbackState = data.state;
                updatePlaybackUI();
            }
        });

        // Poll for status periodically (fallback)
        setInterval(function() {
            sendDaemonCommand('status');
        }, CONFIG.statusPollInterval);
    }

    // ========================================
    // Playback Control (REAL - via daemon)
    // ========================================
    function playTrack(index) {
        if (index < 0 || index >= STATE.playlist.length) {
            log('Invalid track index: ' + index);
            return;
        }

        var track = STATE.playlist[index];
        STATE.currentTrackIndex = index;
        STATE.currentTrack = track;

        var params = {
            track: '/mnt/us/music/' + track.filename,
            volume: (STATE.volume / 100).toFixed(2),
            speed: STATE.speed.toString(),
            pitch: STATE.pitch.toString(),
            effects: buildEffectsString()
        };

        log('Playing track: ' + track.title);

        if (sendDaemonCommand('play', params)) {
            STATE.playbackState = 'playing';
            updateNowPlaying(track);
            updatePlaylistUI();
            updatePlaybackUI();
        }
    }

    function togglePlayPause() {
        if (STATE.playbackState === 'playing') {
            sendDaemonCommand('pause');
            STATE.playbackState = 'paused';
        } else if (STATE.playbackState === 'paused') {
            sendDaemonCommand('resume');
            STATE.playbackState = 'playing';
        } else {
            // Start playing first track
            if (STATE.playlist.length > 0) {
                playTrack(STATE.currentTrackIndex >= 0 ? STATE.currentTrackIndex : 0);
            }
        }
        updatePlaybackUI();
    }

    function stopPlayback() {
        sendDaemonCommand('stop');
        STATE.playbackState = 'stopped';
        STATE.currentTrackIndex = -1;
        updatePlaybackUI();
        log('Playback stopped');
    }

    function nextTrack() {
        if (STATE.playlist.length === 0) return;

        var nextIndex = STATE.currentTrackIndex + 1;
        if (nextIndex >= STATE.playlist.length) {
            if (STATE.settings.repeat) {
                nextIndex = 0;
            } else {
                stopPlayback();
                return;
            }
        }

        playTrack(nextIndex);
    }

    function previousTrack() {
        if (STATE.playlist.length === 0) return;

        var prevIndex = STATE.currentTrackIndex - 1;
        if (prevIndex < 0) {
            prevIndex = STATE.playlist.length - 1;
        }

        playTrack(prevIndex);
    }

    function changeVolume(delta) {
        STATE.volume = Math.max(0, Math.min(100, STATE.volume + delta));
        updateVolumeUI();

        // If playing, restart with new volume
        if (STATE.playbackState === 'playing' && STATE.currentTrackIndex >= 0) {
            playTrack(STATE.currentTrackIndex);
        }
    }

    function applyEffects() {
        // If playing, restart with new effects
        if (STATE.playbackState === 'playing' && STATE.currentTrackIndex >= 0) {
            playTrack(STATE.currentTrackIndex);
        }
    }

    // ========================================
    // File Loading (REAL - uses mesquito SDK)
    // ========================================
    function loadMusicFiles() {
        log('Loading music files from: ' + CONFIG.musicPath);

        if (typeof getDirectory !== 'function') {
            log('ERROR: getDirectory not available. Loading fallback demo files.');
            loadFallbackFiles();
            return;
        }

        getDirectory(CONFIG.musicPath).then(function(files) {
            log('Retrieved ' + files.length + ' files from directory');
            processMusicFiles(files);
        }).catch(function(error) {
            log('ERROR loading directory: ' + error);
            loadFallbackFiles();
        });
    }

    function loadFallbackFiles() {
        // Fallback for testing without file system access
        log('Using fallback demo playlist');
        processMusicFiles([
            {name: 'Track 01.mp3', path: '/mnt/us/music/Track 01.mp3'},
            {name: 'Track 02.flac', path: '/mnt/us/music/Track 02.flac'},
            {name: 'Track 03.ogg', path: '/mnt/us/music/Track 03.ogg'}
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

        log('Loaded ' + STATE.playlist.length + ' tracks');
        updatePlaylistUI();
        document.getElementById('playlist-count').textContent = STATE.playlist.length + ' track' + (STATE.playlist.length === 1 ? '' : 's');
    }

    // ========================================
    // UI Updates
    // ========================================
    function updateNowPlaying(track) {
        document.getElementById('track-title').textContent = track.title;
        document.getElementById('track-artist').textContent = track.artist;
        document.getElementById('track-album').textContent = track.format + ' Audio';
    }

    function updatePlaybackUI() {
        var playBtn = document.getElementById('play-btn');

        if (STATE.playbackState === 'playing') {
            playBtn.textContent = '⏸';
            playBtn.title = 'Pause';
        } else {
            playBtn.textContent = '▶';
            playBtn.title = 'Play';
        }
    }

    function updateVolumeUI() {
        document.getElementById('volume-fill').style.width = STATE.volume + '%';
        document.getElementById('volume-value').textContent = STATE.volume + '%';
    }

    function updatePlaylistUI() {
        var playlistEl = document.getElementById('playlist');
        playlistEl.innerHTML = '';

        if (STATE.playlist.length === 0) {
            var emptyItem = document.createElement('div');
            emptyItem.className = 'playlist-item loading';
            emptyItem.textContent = 'No music files found. Add files to /mnt/us/music/';
            playlistEl.appendChild(emptyItem);
            return;
        }

        for (var i = 0; i < STATE.playlist.length; i++) {
            var track = STATE.playlist[i];
            var item = document.createElement('div');
            item.className = 'playlist-item';
            item.setAttribute('data-index', i);

            if (i === STATE.currentTrackIndex) {
                item.className += ' active';
            }

            item.innerHTML = '<span class="track-name">' + track.title + '</span><br>' +
                           '<span class="track-details">' + track.artist + ' • ' + track.format + '</span>';

            playlistEl.appendChild(item);
        }
    }

    function updateClock() {
        var now = new Date();
        var h = now.getHours();
        var m = now.getMinutes();
        document.getElementById('time-display').textContent =
            (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    }

    function updateWifiStatus() {
        var statusEl = document.getElementById('wifi-status');
        if (typeof kindle !== 'undefined' && kindle.net && kindle.net.getWirelessState) {
            var state = kindle.net.getWirelessState();
            statusEl.textContent = 'WiFi: ' + (state === 'on' ? 'On' : 'Off');
        } else {
            statusEl.textContent = 'WiFi: N/A';
        }
    }

    // ========================================
    // Event Handlers
    // ========================================
    function initializeEventListeners() {
        // Playback controls
        document.getElementById('play-btn').addEventListener('click', togglePlayPause);
        document.getElementById('stop-btn').addEventListener('click', stopPlayback);
        document.getElementById('next-btn').addEventListener('click', nextTrack);
        document.getElementById('prev-btn').addEventListener('click', previousTrack);

        // Volume
        document.getElementById('vol-up').addEventListener('click', function() {
            changeVolume(10);
        });

        document.getElementById('vol-down').addEventListener('click', function() {
            changeVolume(-10);
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
                applyEffects();
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
                applyEffects();
            });
        }

        // Effect toggles
        ['reverb', 'echo', 'bass', 'treble'].forEach(function(effect) {
            document.getElementById(effect + '-btn').addEventListener('click', function() {
                STATE.effects[effect] = !STATE.effects[effect];
                this.className = STATE.effects[effect] ? 'toggle-btn active' : 'toggle-btn';
                applyEffects();
            });
        });

        // Reset effects
        document.getElementById('reset-effects').addEventListener('click', function() {
            STATE.speed = 1.0;
            STATE.pitch = 0;
            STATE.effects = {reverb: false, echo: false, bass: false, treble: false};

            // Reset UI
            document.querySelectorAll('[data-speed]').forEach(function(btn) {
                btn.className = btn.getAttribute('data-speed') === '1.0' ? 'effect-btn active' : 'effect-btn';
            });

            document.querySelectorAll('[data-pitch]').forEach(function(btn) {
                btn.className = btn.getAttribute('data-pitch') === '0' ? 'effect-btn active' : 'effect-btn';
            });

            ['reverb', 'echo', 'bass', 'treble'].forEach(function(effect) {
                document.getElementById(effect + '-btn').className = 'toggle-btn';
            });

            applyEffects();
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

        document.getElementById('clear-btn').addEventListener('click', function() {
            stopPlayback();
            STATE.playlist = [];
            STATE.currentTrackIndex = -1;
            updatePlaylistUI();
        });

        // Playlist item clicks
        document.getElementById('playlist').addEventListener('click', function(e) {
            var item = e.target;
            while (item && !item.getAttribute('data-index')) {
                item = item.parentNode;
            }
            if (item && item.getAttribute('data-index')) {
                playTrack(parseInt(item.getAttribute('data-index')));
            }
        });

        // Settings
        document.getElementById('settings-btn').addEventListener('click', function() {
            document.getElementById('auto-next').checked = STATE.settings.autoNext;
            document.getElementById('repeat-mode').checked = STATE.settings.repeat;
            document.getElementById('show-logs').checked = STATE.settings.showLogs;
            document.getElementById('settings-modal').className = 'modal active';
        });

        document.getElementById('close-settings').addEventListener('click', function() {
            STATE.settings.autoNext = document.getElementById('auto-next').checked;
            STATE.settings.repeat = document.getElementById('repeat-mode').checked;
            STATE.settings.showLogs = document.getElementById('show-logs').checked;

            document.getElementById('debug-console').className = STATE.settings.showLogs ? 'debug-console active' : 'debug-console';
            document.getElementById('settings-modal').className = 'modal';
        });

        document.getElementById('reload-btn').addEventListener('click', function() {
            window.location.reload();
        });

        document.getElementById('clear-log').addEventListener('click', function() {
            document.getElementById('debug-output').innerHTML = '';
        });
    }

    // ========================================
    // Initialization
    // ========================================
    function initialize() {
        log('Sox Audio Player initializing...');

        // Check if running on Kindle
        if (typeof kindle === 'undefined') {
            log('WARNING: Not running on Kindle - some features disabled');
        }

        // Setup Kindle integration
        if (typeof kindle !== 'undefined' && kindle.appmgr) {
            kindle.appmgr.ongo = function(context) {
                log('App activated');
                if (window.mesquito && window.mesquito.updateNavigation) {
                    window.mesquito.updateNavigation();
                }
            };
        }

        // Setup LIPC status listener
        setupStatusListener();

        // Initialize UI
        initializeEventListeners();
        updateVolumeUI();
        updateWifiStatus();
        updateClock();

        // Load music files
        loadMusicFiles();

        // Update clock every minute
        setInterval(updateClock, 60000);

        // Update wifi status every 30 seconds
        setInterval(updateWifiStatus, 30000);

        log('Initialization complete');
        log('IMPORTANT: Ensure soxd daemon is running!');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
