// Sox Audio Player - ES5 Compatible JavaScript
// No arrow functions, const/let, fetch, or ES6+ features

(function() {
    'use strict';

    // ========================================
    // Configuration & State
    // ========================================
    var CONFIG = {
        musicPath: '/mnt/us/music/',
        soxPath: '/mnt/us/sox/',
        soxBinary: '/mnt/us/sox/sox',
        playBinary: '/mnt/us/sox/play',
        supportedFormats: ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac', '.wma']
    };

    var STATE = {
        playlist: [],
        currentTrackIndex: -1,
        isPlaying: false,
        isPaused: false,
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
        },
        playbackProcess: null,
        currentTime: 0,
        totalTime: 0
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
                output.scrollTop = output.scrollHeight;
            }
        }
        if (window.mesquito && window.mesquito.log) {
            window.mesquito.log(message);
        }
        console.log(message);
    }

    function showError(message) {
        log('ERROR: ' + message);
        alert('Error: ' + message);
    }

    function formatTime(seconds) {
        var mins = Math.floor(seconds / 60);
        var secs = Math.floor(seconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    function getFileExtension(filename) {
        var parts = filename.split('.');
        return parts.length > 1 ? '.' + parts[parts.length - 1].toLowerCase() : '';
    }

    function getFileName(filepath) {
        var parts = filepath.split('/');
        return parts[parts.length - 1];
    }

    function parseTrackName(filename) {
        // Remove extension
        var name = filename.replace(/\.[^/.]+$/, '');
        // Try to parse artist - title format
        var parts = name.split(' - ');
        if (parts.length === 2) {
            return {
                artist: parts[0].trim(),
                title: parts[1].trim(),
                album: 'Unknown Album'
            };
        }
        return {
            artist: 'Unknown Artist',
            title: name,
            album: 'Unknown Album'
        };
    }

    // ========================================
    // File System Operations
    // ========================================
    function loadMusicFiles() {
        log('Loading music files from: ' + CONFIG.musicPath);

        // Check if mesquito SDK is available for file access
        if (typeof getDirectory === 'function') {
            getDirectory(CONFIG.musicPath).then(function(files) {
                processMusicFiles(files);
            }).catch(function(error) {
                log('Error loading directory: ' + error);
                loadMusicFilesFallback();
            });
        } else {
            loadMusicFilesFallback();
        }
    }

    function loadMusicFilesFallback() {
        // Fallback: Try to execute shell command to list files
        log('Using fallback file loading method');

        // For demo purposes, create sample playlist
        // In real deployment, this would use shell execution
        var sampleFiles = [
            {name: 'sample1.mp3', path: CONFIG.musicPath + 'sample1.mp3'},
            {name: 'sample2.mp3', path: CONFIG.musicPath + 'sample2.mp3'},
            {name: 'sample3.wav', path: CONFIG.musicPath + 'sample3.wav'}
        ];

        processMusicFiles(sampleFiles);
    }

    function processMusicFiles(files) {
        STATE.playlist = [];

        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var ext = getFileExtension(file.name);

            // Check if it's a supported audio format
            if (CONFIG.supportedFormats.indexOf(ext) !== -1) {
                var trackInfo = parseTrackName(file.name);
                STATE.playlist.push({
                    path: file.path || CONFIG.musicPath + file.name,
                    filename: file.name,
                    artist: trackInfo.artist,
                    title: trackInfo.title,
                    album: trackInfo.album,
                    format: ext.substring(1)
                });
            }
        }

        log('Loaded ' + STATE.playlist.length + ' audio files');
        updatePlaylistUI();
    }

    // ========================================
    // Sox Integration
    // ========================================
    function buildSoxCommand(trackPath) {
        var cmd = CONFIG.playBinary + ' "' + trackPath + '"';

        // Volume
        var vol = STATE.volume / 100;
        cmd += ' vol ' + vol;

        // Speed (tempo without pitch change)
        if (STATE.speed !== 1.0) {
            cmd += ' tempo ' + STATE.speed;
        }

        // Pitch shift
        if (STATE.pitch !== 0) {
            cmd += ' pitch ' + STATE.pitch;
        }

        // Effects
        if (STATE.effects.reverb) {
            cmd += ' reverb 50';
        }

        if (STATE.effects.echo) {
            cmd += ' echo 0.8 0.88 60 0.4';
        }

        if (STATE.effects.bass) {
            cmd += ' bass +10';
        }

        if (STATE.effects.treble) {
            cmd += ' treble +8';
        }

        log('Sox command: ' + cmd);
        return cmd;
    }

    function playTrack(index) {
        if (index < 0 || index >= STATE.playlist.length) {
            log('Invalid track index: ' + index);
            return;
        }

        stopPlayback();

        STATE.currentTrackIndex = index;
        var track = STATE.playlist[index];

        log('Playing: ' + track.filename);
        updateNowPlaying(track);
        updatePlaylistUI();

        // Build and execute sox command
        var command = buildSoxCommand(track.path);

        // In real Kindle environment, this would execute the command
        // For now, we simulate playback
        STATE.isPlaying = true;
        STATE.isPaused = false;

        // Update UI
        document.getElementById('play-btn').textContent = '⏸';
        document.getElementById('play-btn').title = 'Pause';

        // Simulate playback progress
        simulatePlayback();
    }

    function stopPlayback() {
        if (STATE.playbackProcess) {
            // Kill the sox process
            log('Stopping playback');
            STATE.playbackProcess = null;
        }

        STATE.isPlaying = false;
        STATE.isPaused = false;
        STATE.currentTime = 0;

        document.getElementById('play-btn').textContent = '▶';
        document.getElementById('play-btn').title = 'Play';

        updateProgress();
    }

    function togglePlayPause() {
        if (STATE.isPlaying && !STATE.isPaused) {
            // Pause
            STATE.isPaused = true;
            document.getElementById('play-btn').textContent = '▶';
            log('Paused');
        } else if (STATE.isPaused) {
            // Resume
            STATE.isPaused = false;
            document.getElementById('play-btn').textContent = '⏸';
            log('Resumed');
        } else {
            // Start playing
            if (STATE.currentTrackIndex === -1 && STATE.playlist.length > 0) {
                playTrack(0);
            } else if (STATE.currentTrackIndex >= 0) {
                playTrack(STATE.currentTrackIndex);
            }
        }
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

    function simulatePlayback() {
        // This simulates playback progress
        // In real implementation, this would read from sox process
        STATE.totalTime = 180; // 3 minutes default
        STATE.currentTime = 0;

        var interval = setInterval(function() {
            if (!STATE.isPlaying || STATE.isPaused) {
                clearInterval(interval);
                return;
            }

            STATE.currentTime += 1;
            updateProgress();

            if (STATE.currentTime >= STATE.totalTime) {
                clearInterval(interval);
                if (STATE.settings.autoNext) {
                    nextTrack();
                } else {
                    stopPlayback();
                }
            }
        }, 1000);
    }

    // ========================================
    // UI Updates
    // ========================================
    function updateNowPlaying(track) {
        document.getElementById('track-title').textContent = track.title;
        document.getElementById('track-artist').textContent = track.artist;
        document.getElementById('track-album').textContent = track.album;
    }

    function updateProgress() {
        var currentTimeEl = document.getElementById('current-time');
        var totalTimeEl = document.getElementById('total-time');
        var progressFill = document.getElementById('progress-fill');

        currentTimeEl.textContent = formatTime(STATE.currentTime);
        totalTimeEl.textContent = formatTime(STATE.totalTime);

        var percentage = STATE.totalTime > 0 ? (STATE.currentTime / STATE.totalTime) * 100 : 0;
        progressFill.style.width = percentage + '%';
    }

    function updatePlaylistUI() {
        var playlistEl = document.getElementById('playlist');
        var countEl = document.getElementById('playlist-count');

        playlistEl.innerHTML = '';

        if (STATE.playlist.length === 0) {
            var emptyItem = document.createElement('div');
            emptyItem.className = 'playlist-item loading';
            emptyItem.textContent = 'No music files found. Add files to ' + CONFIG.musicPath;
            playlistEl.appendChild(emptyItem);
            countEl.textContent = '0 tracks';
            return;
        }

        countEl.textContent = STATE.playlist.length + ' track' + (STATE.playlist.length === 1 ? '' : 's');

        for (var i = 0; i < STATE.playlist.length; i++) {
            var track = STATE.playlist[i];
            var item = document.createElement('div');
            item.className = 'playlist-item';
            item.setAttribute('data-index', i);

            if (i === STATE.currentTrackIndex) {
                item.className += ' active';
            }

            var trackName = document.createElement('span');
            trackName.className = 'track-name';
            trackName.textContent = track.title;

            var trackDetails = document.createElement('span');
            trackDetails.className = 'track-details';
            trackDetails.textContent = track.artist + ' • ' + track.format.toUpperCase();

            item.appendChild(trackName);
            item.appendChild(document.createElement('br'));
            item.appendChild(trackDetails);

            playlistEl.appendChild(item);
        }
    }

    function updateVolume() {
        var volumeFill = document.getElementById('volume-fill');
        var volumeValue = document.getElementById('volume-value');

        volumeFill.style.width = STATE.volume + '%';
        volumeValue.textContent = STATE.volume + '%';
    }

    function updateWifiStatus() {
        var statusEl = document.getElementById('wifi-status');

        if (typeof kindle !== 'undefined' && kindle.net && kindle.net.getWirelessState) {
            var wifiState = kindle.net.getWirelessState();
            statusEl.textContent = 'WiFi: ' + (wifiState === 'on' ? 'On' : 'Off');
        } else {
            statusEl.textContent = 'WiFi: Unknown';
        }
    }

    function updateClock() {
        var timeEl = document.getElementById('time-display');
        var now = new Date();
        var hours = now.getHours();
        var minutes = now.getMinutes();
        timeEl.textContent = (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes;
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

        // Volume controls
        document.getElementById('vol-up').addEventListener('click', function() {
            STATE.volume = Math.min(100, STATE.volume + 10);
            updateVolume();
        });

        document.getElementById('vol-down').addEventListener('click', function() {
            STATE.volume = Math.max(0, STATE.volume - 10);
            updateVolume();
        });

        // Progress bar seeking
        document.getElementById('progress-bar').addEventListener('click', function(e) {
            var bar = e.currentTarget;
            var rect = bar.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var percentage = x / rect.width;
            STATE.currentTime = Math.floor(STATE.totalTime * percentage);
            updateProgress();
        });

        // Speed controls
        var speedBtns = document.querySelectorAll('[data-speed]');
        for (var i = 0; i < speedBtns.length; i++) {
            speedBtns[i].addEventListener('click', function() {
                // Remove active class from all
                var allBtns = document.querySelectorAll('[data-speed]');
                for (var j = 0; j < allBtns.length; j++) {
                    allBtns[j].className = allBtns[j].className.replace(' active', '');
                }
                // Add to clicked
                this.className += ' active';
                STATE.speed = parseFloat(this.getAttribute('data-speed'));
                log('Speed set to: ' + STATE.speed + 'x');
            });
        }

        // Pitch controls
        var pitchBtns = document.querySelectorAll('[data-pitch]');
        for (var i = 0; i < pitchBtns.length; i++) {
            pitchBtns[i].addEventListener('click', function() {
                // Remove active class from all
                var allBtns = document.querySelectorAll('[data-pitch]');
                for (var j = 0; j < allBtns.length; j++) {
                    allBtns[j].className = allBtns[j].className.replace(' active', '');
                }
                // Add to clicked
                this.className += ' active';
                STATE.pitch = parseInt(this.getAttribute('data-pitch'));
                log('Pitch set to: ' + STATE.pitch);
            });
        }

        // Effect toggles
        document.getElementById('reverb-btn').addEventListener('click', function() {
            STATE.effects.reverb = !STATE.effects.reverb;
            this.className = STATE.effects.reverb ? 'toggle-btn active' : 'toggle-btn';
            log('Reverb: ' + (STATE.effects.reverb ? 'ON' : 'OFF'));
        });

        document.getElementById('echo-btn').addEventListener('click', function() {
            STATE.effects.echo = !STATE.effects.echo;
            this.className = STATE.effects.echo ? 'toggle-btn active' : 'toggle-btn';
            log('Echo: ' + (STATE.effects.echo ? 'ON' : 'OFF'));
        });

        document.getElementById('bass-btn').addEventListener('click', function() {
            STATE.effects.bass = !STATE.effects.bass;
            this.className = STATE.effects.bass ? 'toggle-btn active' : 'toggle-btn';
            log('Bass Boost: ' + (STATE.effects.bass ? 'ON' : 'OFF'));
        });

        document.getElementById('treble-btn').addEventListener('click', function() {
            STATE.effects.treble = !STATE.effects.treble;
            this.className = STATE.effects.treble ? 'toggle-btn active' : 'toggle-btn';
            log('Treble Boost: ' + (STATE.effects.treble ? 'ON' : 'OFF'));
        });

        document.getElementById('reset-effects').addEventListener('click', function() {
            STATE.speed = 1.0;
            STATE.pitch = 0;
            STATE.effects = {reverb: false, echo: false, bass: false, treble: false};

            // Reset UI
            var speedBtns = document.querySelectorAll('[data-speed]');
            for (var i = 0; i < speedBtns.length; i++) {
                speedBtns[i].className = speedBtns[i].className.replace(' active', '');
                if (speedBtns[i].getAttribute('data-speed') === '1.0') {
                    speedBtns[i].className += ' active';
                }
            }

            var pitchBtns = document.querySelectorAll('[data-pitch]');
            for (var i = 0; i < pitchBtns.length; i++) {
                pitchBtns[i].className = pitchBtns[i].className.replace(' active', '');
                if (pitchBtns[i].getAttribute('data-pitch') === '0') {
                    pitchBtns[i].className += ' active';
                }
            }

            document.getElementById('reverb-btn').className = 'toggle-btn';
            document.getElementById('echo-btn').className = 'toggle-btn';
            document.getElementById('bass-btn').className = 'toggle-btn';
            document.getElementById('treble-btn').className = 'toggle-btn';

            log('Effects reset');
        });

        // Playlist controls
        document.getElementById('refresh-btn').addEventListener('click', loadMusicFiles);

        document.getElementById('shuffle-btn').addEventListener('click', function() {
            // Fisher-Yates shuffle
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
            log('Playlist cleared');
        });

        // Playlist item clicks
        document.getElementById('playlist').addEventListener('click', function(e) {
            var item = e.target;
            // Find the playlist-item parent
            while (item && !item.className.match(/playlist-item/)) {
                item = item.parentNode;
            }

            if (item && item.hasAttribute('data-index')) {
                var index = parseInt(item.getAttribute('data-index'));
                playTrack(index);
            }
        });

        // Format conversion
        document.getElementById('format-btn').addEventListener('click', function() {
            if (STATE.currentTrackIndex === -1) {
                showError('No track selected');
                return;
            }
            document.getElementById('format-modal').className = 'modal active';
        });

        document.getElementById('close-modal').addEventListener('click', function() {
            document.getElementById('format-modal').className = 'modal';
        });

        var formatBtns = document.querySelectorAll('.format-btn');
        for (var i = 0; i < formatBtns.length; i++) {
            formatBtns[i].addEventListener('click', function() {
                var format = this.getAttribute('data-format');
                convertFormat(format);
            });
        }

        // Settings
        document.getElementById('settings-btn').addEventListener('click', function() {
            // Load current settings
            document.getElementById('auto-next').checked = STATE.settings.autoNext;
            document.getElementById('repeat-mode').checked = STATE.settings.repeat;
            document.getElementById('show-logs').checked = STATE.settings.showLogs;

            document.getElementById('settings-modal').className = 'modal active';
        });

        document.getElementById('close-settings').addEventListener('click', function() {
            // Save settings
            STATE.settings.autoNext = document.getElementById('auto-next').checked;
            STATE.settings.repeat = document.getElementById('repeat-mode').checked;
            STATE.settings.showLogs = document.getElementById('show-logs').checked;

            // Toggle debug console
            var debugConsole = document.getElementById('debug-console');
            debugConsole.className = STATE.settings.showLogs ? 'debug-console active' : 'debug-console';

            document.getElementById('settings-modal').className = 'modal';
            log('Settings saved');
        });

        document.getElementById('reload-btn').addEventListener('click', function() {
            window.location.reload();
        });

        document.getElementById('clear-log').addEventListener('click', function() {
            document.getElementById('debug-output').innerHTML = '';
        });
    }

    function convertFormat(targetFormat) {
        if (STATE.currentTrackIndex === -1) {
            showError('No track selected');
            return;
        }

        var track = STATE.playlist[STATE.currentTrackIndex];
        var outputPath = track.path.replace(/\.[^/.]+$/, '') + '_converted.' + targetFormat;

        var cmd = CONFIG.soxBinary + ' "' + track.path + '" "' + outputPath + '"';

        log('Converting to ' + targetFormat.toUpperCase() + ': ' + cmd);

        // In real implementation, execute this command
        // For now, just show message
        alert('Converting ' + track.filename + ' to ' + targetFormat.toUpperCase() + '\n\nCommand: ' + cmd + '\n\nOutput: ' + outputPath);

        document.getElementById('format-modal').className = 'modal';
    }

    // ========================================
    // Initialization
    // ========================================
    function initialize() {
        log('Sox Audio Player initializing...');

        // Set up Kindle integration
        if (typeof kindle !== 'undefined' && kindle.appmgr) {
            kindle.appmgr.ongo = function(context) {
                log('App activated');
                if (window.mesquito && window.mesquito.updateNavigation) {
                    window.mesquito.updateNavigation();
                }
            };
        }

        // Initialize UI
        initializeEventListeners();
        updateVolume();
        updateWifiStatus();
        updateClock();

        // Load music files
        loadMusicFiles();

        // Update clock every minute
        setInterval(updateClock, 60000);

        // Update wifi status every 30 seconds
        setInterval(updateWifiStatus, 30000);

        log('Initialization complete');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
