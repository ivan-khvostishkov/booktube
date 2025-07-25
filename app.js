// YouTube IFrame API
let player;
let playerReady = false;
let positionSaveInterval;
let sleepTimerTimeout;
let sleepTimerInterval;
let sleepTimerEndTime;

// Load YouTube IFrame API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// DOM Elements - Get them after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const mainScreen = document.getElementById('mainScreen');
    const playerScreen = document.getElementById('playerScreen');
    const playForm = document.getElementById('playForm');
    const videoInput = document.getElementById('videoInput');
    const sleepTimerSelect = document.getElementById('sleepTimer');
    const loopCheckbox = document.getElementById('loopVideo');
    const positionSelect = document.getElementById('position');
    const backToMain = document.getElementById('backToMain');
    const helpIcon = document.getElementById('helpIcon');
    const helpModal = document.getElementById('helpModal');
    const closeModal = document.querySelector('.close');
    const currentYearSpan = document.getElementById('currentYear');
    const sleepTimerOverlay = document.getElementById('sleepTimerOverlay');
    const sleepTimerDisplay = document.getElementById('sleepTimerDisplay');

    // Set current year
    currentYearSpan.textContent = new Date().getFullYear();

    // Extract video ID from URL
    function extractVideoId(input) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = input.match(regex);
        return match ? match[1] : input;
    }

    // Parse query parameters
    function parseQueryParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            videoId: params.get('v'),
            sleepTimer: params.get('sleep') || '0',
            loop: params.get('loop') === 'true',
            position: params.get('pos') || 'beginning',
            edit: params.get('edit') === 'true'
        };
    }

    // Update URL with parameters
    function updateURL(params, includeEdit = false) {
        const url = new URL(window.location);
        url.searchParams.set('v', params.videoId);
        url.searchParams.set('sleep', params.sleepTimer);
        url.searchParams.set('loop', params.loop);
        url.searchParams.set('pos', params.position);

        if (includeEdit) {
            url.searchParams.set('edit', 'true');
        } else {
            url.searchParams.delete('edit');
        }

        window.history.pushState({}, '', url);
    }

    // Save position to localStorage
    function savePosition(videoId, position) {
        localStorage.setItem(`booktube_position_${videoId}`, position);
    }

    // Get saved position from localStorage
    function getSavedPosition(videoId) {
        return parseFloat(localStorage.getItem(`booktube_position_${videoId}`) || '0');
    }

    // Format time for display
    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    // Update sleep timer display
    function updateSleepTimerDisplay() {
        if (!sleepTimerEndTime) {
            sleepTimerOverlay.classList.remove('active');
            return;
        }

        const now = Date.now();
        const remainingMs = sleepTimerEndTime - now;

        if (remainingMs <= 0) {
            sleepTimerOverlay.classList.remove('active');
            clearInterval(sleepTimerInterval);
            return;
        }

        const remainingSeconds = Math.ceil(remainingMs / 1000);
        sleepTimerDisplay.textContent = formatTime(remainingSeconds);

        // Add warning class when less than 1 minute remaining
        if (remainingSeconds <= 60) {
            sleepTimerOverlay.classList.add('warning');
        } else {
            sleepTimerOverlay.classList.remove('warning');
        }
    }

    // Get random start time for video
    function getRandomStartTime(videoId, callback) {
        // Create a temporary player to get duration
        const tempDiv = document.createElement('div');
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);

        const tempPlayer = new YT.Player(tempDiv, {
            videoId: videoId,
            events: {
                onReady: function(event) {
                    const duration = event.target.getDuration();
                    const randomTime = Math.floor(Math.random() * duration * 0.9); // Use 90% to avoid very end
                    tempPlayer.destroy();
                    document.body.removeChild(tempDiv);
                    callback(randomTime);
                }
            }
        });
    }

    // Switch to player screen
    window.showPlayerScreen = function() {
        console.log('Switching to player screen');
        mainScreen.style.display = 'none';
        mainScreen.classList.remove('active');
        playerScreen.style.display = 'block';
        playerScreen.classList.add('active');
    }

    // Switch to main screen
    window.showMainScreen = function() {
        console.log('Switching to main screen');
        playerScreen.style.display = 'none';
        playerScreen.classList.remove('active');
        mainScreen.style.display = 'flex';
        mainScreen.classList.add('active');
    }

    // Load form values from params
    function loadFormFromParams(params) {
        if (params.videoId) {
            videoInput.value = params.videoId;
            sleepTimerSelect.value = params.sleepTimer;
            loopCheckbox.checked = params.loop;
            positionSelect.value = params.position;
        }
    }

    // Create YouTube player
    window.createPlayer = function(videoId, startSeconds, params) {
        console.log('Creating player for video:', videoId, 'starting at', startSeconds);

        // Clear any existing player
        const playerDiv = document.getElementById('youtubePlayer');
        playerDiv.innerHTML = '';

        const playerVars = {
            autoplay: 1,
            start: Math.floor(startSeconds),
            modestbranding: 1,
            rel: 0,
            fs: 1
        };

        player = new YT.Player('youtubePlayer', {
            width: '100%',
            height: '100%',
            videoId: videoId,
            playerVars: playerVars,
            events: {
                onReady: function(event) {
                    window.onPlayerReady(event, params);
                },
                onStateChange: window.onPlayerStateChange
            }
        });
    }

    // Player ready handler
    window.onPlayerReady = function(event, params) {
        console.log('Player ready');
        event.target.playVideo();

        // Start position saving if not random
        if (params.position !== 'random') {
            positionSaveInterval = setInterval(() => {
                if (player && player.getCurrentTime) {
                    const currentTime = player.getCurrentTime();
                    savePosition(params.videoId, currentTime);
                }
            }, 5000); // Save every 5 seconds
        }
    }

    // Player state change handler
    window.onPlayerStateChange = function(event) {
        if (event.data === YT.PlayerState.ENDED) {
            const params = parseQueryParams();
            if (params.loop) {
                player.seekTo(0);
                player.playVideo();
            }
        }
    }

    // Start player
    window.startPlayer = function(params) {
        console.log('Starting player with params:', params);

        // First show the player screen
        window.showPlayerScreen();

        // Update URL (remove edit mode when playing)
        updateURL(params, false);

        // Set sleep timer
        if (params.sleepTimer !== '0') {
            const minutes = parseInt(params.sleepTimer);
            sleepTimerEndTime = Date.now() + (minutes * 60 * 1000);

            // Show sleep timer overlay
            sleepTimerOverlay.classList.add('active');
            updateSleepTimerDisplay();

            // Update display every second
            sleepTimerInterval = setInterval(updateSleepTimerDisplay, 1000);

            // Set timeout to pause video
            sleepTimerTimeout = setTimeout(() => {
                if (player && player.pauseVideo) {
                    player.pauseVideo();
                }
                sleepTimerOverlay.classList.remove('active');
                clearInterval(sleepTimerInterval);
            }, minutes * 60 * 1000);
        }

        // Determine start position
        let startSeconds = 0;
        if (params.position === 'saved') {
            startSeconds = getSavedPosition(params.videoId);
        }

        // Create player after screen transition
        setTimeout(() => {
            if (playerReady) {
                if (params.position === 'random') {
                    // For random position, get duration first then create player
                    getRandomStartTime(params.videoId, (randomTime) => {
                        window.createPlayer(params.videoId, randomTime, params);
                    });
                } else {
                    window.createPlayer(params.videoId, startSeconds, params);
                }
            } else {
                console.error('YouTube API not ready yet');
            }
        }, 100);
    }

    // Form submit handler
    playForm.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('Form submitted');

        const videoId = extractVideoId(videoInput.value.trim());

        if (!videoId) {
            alert('Please enter a valid YouTube video ID or URL');
            return;
        }

        const params = {
            videoId: videoId,
            sleepTimer: sleepTimerSelect.value,
            loop: loopCheckbox.checked,
            position: positionSelect.value
        };

        window.startPlayer(params);
    });

    // Back to main handler (edit mode)
    backToMain.addEventListener('click', () => {
        console.log('Back to main clicked - entering edit mode');

        // Clear intervals and timeouts
        if (positionSaveInterval) {
            clearInterval(positionSaveInterval);
            positionSaveInterval = null;
        }
        if (sleepTimerTimeout) {
            clearTimeout(sleepTimerTimeout);
            sleepTimerTimeout = null;
        }
        if (sleepTimerInterval) {
            clearInterval(sleepTimerInterval);
            sleepTimerInterval = null;
        }

        // Clear sleep timer
        sleepTimerEndTime = null;
        sleepTimerOverlay.classList.remove('active');

        // Destroy player
        if (player && player.destroy) {
            player.destroy();
            player = null;
        }

        // Clear the player div
        document.getElementById('youtubePlayer').innerHTML = '';

        // Switch screens
        window.showMainScreen();

        // Update URL to include edit mode
        const currentParams = parseQueryParams();
        updateURL(currentParams, true);
    });

    // Help modal handlers
    helpIcon.addEventListener('click', () => {
        helpModal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });

    // YouTube API callback
    window.onYouTubeIframeAPIReady = function() {
        console.log('YouTube API ready');
        playerReady = true;

        // Check if we should auto-start based on URL params
        const params = parseQueryParams();
        if (params.videoId) {
            // Load form values
            loadFormFromParams(params);

            // Only auto-play if not in edit mode
            if (!params.edit) {
                window.startPlayer(params);
            }
        }
    }

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        const params = parseQueryParams();
        if (params.videoId) {
            loadFormFromParams(params);
            if (!params.edit) {
                window.startPlayer(params);
            } else {
                window.showMainScreen();
            }
        } else {
            window.showMainScreen();
        }
    });

    // Initial load - check if we're in edit mode
    const initialParams = parseQueryParams();
    if (initialParams.videoId && initialParams.edit) {
        loadFormFromParams(initialParams);
    }
});
