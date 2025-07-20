// YouTube IFrame API
let player;
let playerReady = false;
let positionSaveInterval;
let sleepTimerTimeout;

// Load YouTube IFrame API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// DOM Elements
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
        position: params.get('pos') || 'beginning'
    };
}

// Update URL with parameters
function updateURL(params) {
    const url = new URL(window.location);
    url.searchParams.set('v', params.videoId);
    url.searchParams.set('sleep', params.sleepTimer);
    url.searchParams.set('loop', params.loop);
    url.searchParams.set('pos', params.position);
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

// YouTube API callback
function onYouTubeIframeAPIReady() {
    playerReady = true;

    // Check if we should auto-start based on URL params
    const params = parseQueryParams();
    if (params.videoId) {
        videoInput.value = params.videoId;
        sleepTimerSelect.value = params.sleepTimer;
        loopCheckbox.checked = params.loop;
        positionSelect.value = params.position;
        startPlayer(params);
    }
}

// Create YouTube player
function createPlayer(videoId, startSeconds) {
    player = new YT.Player('youtubePlayer', {
        width: '100%',
        height: '100%',
        videoId: videoId,
        playerVars: {
            autoplay: 1,
            start: Math.floor(startSeconds),
            modestbranding: 1,
            rel: 0
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
}

// Player ready handler
function onPlayerReady(event) {
    event.target.playVideo();

    // Start position saving if not random
    const params = parseQueryParams();
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
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        const params = parseQueryParams();
        if (params.loop) {
            player.seekTo(0);
            player.playVideo();
        }
    }
}

// Start player
function startPlayer(params) {
    mainScreen.classList.remove('active');
    playerScreen.classList.add('active');

    updateURL(params);

    // Set sleep timer
    if (params.sleepTimer !== '0') {
        const minutes = parseInt(params.sleepTimer);
        sleepTimerTimeout = setTimeout(() => {
            if (player && player.pauseVideo) {
                player.pauseVideo();
            }
        }, minutes * 60 * 1000);
    }

    // Determine start position
    let startSeconds = 0;
    if (params.position === 'saved') {
        startSeconds = getSavedPosition(params.videoId);
    } else if (params.position === 'random') {
        // We'll set a random position after the video loads
        startSeconds = 0;
    }

    // Create player
    if (playerReady) {
        createPlayer(params.videoId, startSeconds);

        // If random position, seek to random time after video loads
        if (params.position === 'random') {
            setTimeout(() => {
                if (player && player.getDuration) {
                    const duration = player.getDuration();
                    if (duration > 0) {
                        const randomTime = Math.random() * duration;
                        player.seekTo(randomTime);
                    }
                }
            }, 3000); // Wait for video to load
        }
    }
}

// Form submit handler
playForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const videoId = extractVideoId(videoInput.value);
    const params = {
        videoId: videoId,
        sleepTimer: sleepTimerSelect.value,
        loop: loopCheckbox.checked,
        position: positionSelect.value
    };

    startPlayer(params);
});

// Back to main handler
backToMain.addEventListener('click', () => {
    // Clear intervals and timeouts
    if (positionSaveInterval) {
        clearInterval(positionSaveInterval);
    }
    if (sleepTimerTimeout) {
        clearTimeout(sleepTimerTimeout);
    }

    // Destroy player
    if (player && player.destroy) {
        player.destroy();
    }

    // Reset UI
    playerScreen.classList.remove('active');
    mainScreen.classList.add('active');

    // Clear URL params
    window.history.pushState({}, '', window.location.pathname);
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
