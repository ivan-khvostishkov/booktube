// YouTube IFrame API
let player;
let playerReady = false;
let positionSaveInterval;
let sleepTimerTimeout;
let sleepTimerInterval;
let sleepTimerEndTime;
let currentPlaylist = [];
let currentVideoIndex = 0;
let currentPlaylistId = '';
let isShuffledPlaylist = false;

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
    const titleInput = document.getElementById('titleInput');
    const resetAppButton = document.getElementById('resetAppButton');

    // Set current year
    currentYearSpan.textContent = new Date().getFullYear();

    // Extract video IDs from input (supports multiple IDs and playlist IDs)
    async function extractVideoIds(input) {
        console.log('Extracting video IDs from input:', input);
        const ids = input.trim().split(/\s+/);
        const videoRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const playlistRegex = /(?:youtube\.com\/.*[?&]list=|youtube\.com\/playlist\?list=)([a-zA-Z0-9_-]+)/;
        
        const results = [];
        
        for (const id of ids) {
            console.log('Processing ID:', id);
            // Check if it's a playlist ID or URL
            const playlistMatch = id.match(playlistRegex);
            if (playlistMatch || (id.length > 11 && id.startsWith('PL'))) {
                const playlistId = playlistMatch ? playlistMatch[1] : id;
                console.log('Detected playlist ID:', playlistId);
                currentPlaylistId = playlistId;
                try {
                    const playlistVideos = await fetchPlaylistVideos(playlistId);
                    console.log('Fetched playlist videos:', playlistVideos);
                    results.push(...playlistVideos);
                } catch (error) {
                    console.error('Failed to fetch playlist:', error);
                }
            } else {
                // Handle single video ID or URL
                const videoMatch = id.match(videoRegex);
                const videoId = videoMatch ? videoMatch[1] : id;
                console.log('Processing video ID:', videoId, 'Length:', videoId.length);
                if (videoId.length === 11) {
                    results.push(videoId);
                }
            }
        }
        
        console.log('Final extracted video IDs:', results);
        return results;
    }
    
    // Multiple proxy services for fallback with rate limiting awareness
    const proxyServices = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://cors-anywhere.herokuapp.com/'
    ];

    // Show/hide loading indicator
    function showLoading() {
        document.getElementById('loadingIndicator').classList.add('active');
    }

    function hideLoading() {
        document.getElementById('loadingIndicator').classList.remove('active');
    }

    // Fetch all video IDs from YouTube playlist by scraping playlist page
    async function fetchPlaylistVideos(playlistId) {
        console.log('Fetching playlist videos for ID:', playlistId);
        showLoading();
        
        for (let i = 0; i < proxyServices.length; i++) {
            const proxyUrl = proxyServices[i];
            console.log(`Trying proxy ${i + 1}/${proxyServices.length}:`, proxyUrl);
            
            try {
                const videoIds = await fetchPlaylistFromPage(playlistId, proxyUrl);
                if (videoIds.length > 0) {
                    console.log(`Extracted ${videoIds.length} video IDs from playlist`);
                    hideLoading();
                    return videoIds;
                }
            } catch (error) {
                console.error(`Proxy ${i + 1} failed:`, error);
                // Add delay before trying next proxy to avoid rate limiting
                if (i < proxyServices.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        
        console.log('All methods failed, falling back to RSS');
        hideLoading();
        return await fetchPlaylistVideosRSS(playlistId);
    }
    
    // Fetch playlist videos with continuation support
    async function fetchPlaylistFromPage(playlistId, proxyUrl) {
        const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
        
        const response = await fetch(proxyUrl + encodeURIComponent(playlistUrl));
        
        if (response.status === 429) {
            throw new Error('Rate limited - too many requests');
        }
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const htmlText = await response.text();
        console.log('Playlist page loaded, length:', htmlText.length);
        
        // Extract all video IDs using multiple methods
        const videoIds = [];
        const seenIds = new Set();
        
        // Method 1: Extract from ytInitialData
        const ytDataMatch = htmlText.match(/var ytInitialData = ({.+?});/);
        if (ytDataMatch) {
            try {
                const ytData = JSON.parse(ytDataMatch[1]);
                const extractedIds = extractVideosFromYtData(ytData);
                extractedIds.forEach(id => {
                    if (!seenIds.has(id)) {
                        seenIds.add(id);
                        videoIds.push(id);
                    }
                });
                console.log(`Method 1 (ytInitialData): Found ${extractedIds.length} videos`);
            } catch (e) {
                console.error('Failed to parse ytInitialData:', e);
            }
        }
        
        // Method 2: Extract using enhanced regex patterns
        const patterns = [
            /"videoId":"([a-zA-Z0-9_-]{11})"/g,
            /"watchEndpoint":{"videoId":"([a-zA-Z0-9_-]{11})"/g,
            /\/watch\?v=([a-zA-Z0-9_-]{11})/g,
            /"url":"\/watch\?v=([a-zA-Z0-9_-]{11})/g,
            /data-video-id="([a-zA-Z0-9_-]{11})"/g
        ];
        
        patterns.forEach((pattern, index) => {
            let match;
            let patternCount = 0;
            const regex = new RegExp(pattern.source, pattern.flags);
            
            while ((match = regex.exec(htmlText)) !== null) {
                const videoId = match[1];
                if (videoId && videoId.length === 11 && !seenIds.has(videoId)) {
                    seenIds.add(videoId);
                    videoIds.push(videoId);
                    patternCount++;
                }
            }
            
            if (patternCount > 0) {
                console.log(`Method 2.${index + 1} (regex): Found ${patternCount} new videos`);
            }
        });
        
        // Log initial extraction results
        console.log(`Initial extraction complete: ${videoIds.length} videos found`);
        
        // Fetch additional pages with rate limiting
        console.log('Fetching additional pages with rate limiting...');
        try {
            for (let i = 1; i <= 8; i++) { // Reduced to 8 sequential requests
                await new Promise(resolve => setTimeout(resolve, 250)); // 500ms delay between requests
                
                const moreVideos = await fetchMorePlaylistVideos(playlistId, proxyUrl, i);
                let newCount = 0;
                moreVideos.forEach(id => {
                    if (!seenIds.has(id)) {
                        seenIds.add(id);
                        videoIds.push(id);
                        newCount++;
                    }
                });
                
                if (newCount > 0) {
                    console.log(`Sequential batch ${i}: Found ${newCount} new videos, total: ${videoIds.length}`);
                } else {
                    console.log(`No new videos found in batch ${i}, stopping`);
                    break; // Stop if no new videos found
                }
            }
            
            console.log(`Sequential fetch complete: ${videoIds.length} total videos`);
            
        } catch (error) {
            console.error('Sequential fetch failed:', error);
        }
        
        console.log(`Total videos extracted: ${videoIds.length}`);
        
        // If we have very few videos, this might be a large playlist that needs more fetching
        if (videoIds.length < 50) {
            console.log('Small result set, playlist might be larger than initially extracted');
        }
        
        return videoIds;
    }
    
    // Fetch more videos with retry logic
    async function fetchMorePlaylistVideos(playlistId, proxyUrl, round, retries = 3) {
        const allVideos = [];
        const seenIds = new Set();
        
        // Use different URL patterns to get more coverage
        const urls = [
            `https://www.youtube.com/watch?v=${playlistId.replace('PL', '')}&list=${playlistId}&index=${round * 100}`,
            `https://www.youtube.com/playlist?list=${playlistId}&index=${round * 50}`,
            `https://www.youtube.com/watch?v=${playlistId.replace('PL', '')}&list=${playlistId}&index=${round * 200}`
        ];
        
        for (const url of urls) {
            for (let attempt = 0; attempt < retries; attempt++) {
                try {
                    const response = await fetch(proxyUrl + encodeURIComponent(url));
                    
                    if (response.status === 429) {
                        // Rate limited, wait longer
                        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                        console.log(`Rate limited, waiting ${delay}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    
                    if (!response.ok) break; // Try next URL
                    
                    const content = await response.text();
                    
                    // Extract video IDs using the same patterns
                    const patterns = [
                        /"videoId":"([a-zA-Z0-9_-]{11})"/g,
                        /"watchEndpoint":{"videoId":"([a-zA-Z0-9_-]{11})"/g,
                        /\/watch\?v=([a-zA-Z0-9_-]{11})/g
                    ];
                    
                    patterns.forEach(pattern => {
                        let match;
                        while ((match = pattern.exec(content)) !== null) {
                            const videoId = match[1];
                            if (videoId && videoId.length === 11 && !seenIds.has(videoId)) {
                                seenIds.add(videoId);
                                allVideos.push(videoId);
                            }
                        }
                    });
                    
                    break; // Success, move to next URL
                    
                } catch (error) {
                    if (attempt === retries - 1) {
                        console.log(`Failed to fetch after ${retries} attempts:`, error.message);
                    }
                }
            }
        }
        
        return allVideos;
    }
    
    // Extract video IDs from YouTube's initial data object
    function extractVideosFromYtData(ytData) {
        const videoIds = [];
        
        function traverse(obj, depth = 0) {
            if (depth > 15 || typeof obj !== 'object' || obj === null) return;
            
            // Look for video ID in various object structures
            if (obj.videoId && typeof obj.videoId === 'string' && obj.videoId.length === 11) {
                videoIds.push(obj.videoId);
            }
            
            // Look for playlist video renderer
            if (obj.playlistVideoRenderer && obj.playlistVideoRenderer.videoId) {
                videoIds.push(obj.playlistVideoRenderer.videoId);
            }
            
            // Look for compact video renderer
            if (obj.compactVideoRenderer && obj.compactVideoRenderer.videoId) {
                videoIds.push(obj.compactVideoRenderer.videoId);
            }
            
            // Traverse nested objects and arrays
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    traverse(obj[key], depth + 1);
                }
            }
        }
        
        traverse(ytData);
        
        // Also look for continuation tokens in ytData
        function findContinuation(obj, depth = 0) {
            if (depth > 10 || typeof obj !== 'object' || obj === null) return;
            
            if (obj.continuation && typeof obj.continuation === 'string') {
                console.log(`Found continuation in ytData: ${obj.continuation.substring(0, 50)}...`);
            }
            
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    findContinuation(obj[key], depth + 1);
                }
            }
        }
        
        findContinuation(ytData);
        return [...new Set(videoIds)]; // Remove duplicates
    }
    

    
    // Fallback RSS method (returns only 15 videos)
    async function fetchPlaylistVideosRSS(playlistId) {
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
        
        for (let i = 0; i < proxyServices.length; i++) {
            const proxyUrl = proxyServices[i];
            console.log(`Trying RSS proxy ${i + 1}/${proxyServices.length}:`, proxyUrl);
            
            try {
                const response = await fetch(proxyUrl + encodeURIComponent(rssUrl));
                
                if (response.status === 429) {
                    console.log('RSS rate limited, waiting before retry...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    continue;
                }
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const xmlText = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
                const entries = xmlDoc.getElementsByTagName('entry');
                
                const videoIds = [];
                for (let j = 0; j < entries.length; j++) {
                    const videoId = entries[j].getElementsByTagName('yt:videoId')[0]?.textContent;
                    if (videoId) {
                        videoIds.push(videoId);
                    }
                }
                
                console.log('RSS fallback extracted video IDs:', videoIds.length);
                hideLoading();
                return videoIds;
            } catch (error) {
                console.error(`RSS proxy ${i + 1} failed:`, error);
                if (i < proxyServices.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    hideLoading();
                    throw new Error('All methods failed');
                }
            }
        }
    }

    // Parse query parameters
    function parseQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const videoParam = params.get('v');
        return {
            videoId: videoParam ? videoParam.replace(/\+/g, ' ') : null,
            sleepTimer: params.get('sleep') || '0',
            loop: params.get('loop') === 'true',
            position: params.get('pos') || 'beginning',
            edit: params.get('edit') === 'true',
            title: params.get('title') || ''
        };
    }

    // Update URL with parameters
    async function updateURL(params, includeEdit = false) {
        const url = new URL(window.location);
        
        // Extract video IDs to get clean IDs for URL
        const videoIds = await extractVideoIds(params.videoId);
        const cleanVideoParam = videoIds.length > 0 ? 
            (videoIds.length === 1 ? videoIds[0] : videoIds.join(' ')) : 
            params.videoId;
        
        url.searchParams.set('v', cleanVideoParam);
        url.searchParams.set('sleep', params.sleepTimer);
        url.searchParams.set('loop', params.loop);
        url.searchParams.set('pos', params.position);
        
        if (params.title && params.title !== 'YouTube Audiobook Player') {
            url.searchParams.set('title', params.title);
        } else {
            url.searchParams.delete('title');
        }

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

    // Save playlist position
    function savePlaylistPosition(playlistKey, videoIndex, position) {
        const data = { videoIndex, position };
        localStorage.setItem(`booktube_playlist_${playlistKey}`, JSON.stringify(data));
    }

    // Get saved playlist position
    function getSavedPlaylistPosition(playlistKey) {
        const data = localStorage.getItem(`booktube_playlist_${playlistKey}`);
        return data ? JSON.parse(data) : { videoIndex: 0, position: 0 };
    }

    // Generate playlist key from video IDs
    function getPlaylistKey(videoIds) {
        return videoIds.join('_');
    }

    // Shuffle array using Fisher-Yates algorithm
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
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

    // Update page title
    function updatePageTitle(title) {
        document.title = title && title !== 'YouTube Audiobook Player' ? `BookTube - ${title}` : 'BookTube - YouTube Audiobook Player';
    }

    // Load form values from params
    function loadFormFromParams(params) {
        if (params.videoId) {
            videoInput.value = params.videoId;
            sleepTimerSelect.value = params.sleepTimer;
            loopCheckbox.checked = params.loop;
            positionSelect.value = params.position;
            titleInput.value = params.title || '';
            updatePageTitle(params.title);
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
                    const currentVideoId = currentPlaylist[currentVideoIndex];
                    savePosition(currentVideoId, currentTime);
                    
                    // Save playlist position if multiple videos (but not for shuffled playlists)
                    if (currentPlaylist.length > 1 && !isShuffledPlaylist) {
                        const playlistKey = getPlaylistKey(currentPlaylist);
                        savePlaylistPosition(playlistKey, currentVideoIndex, currentTime);
                    }
                }
            }, 5000); // Save every 5 seconds
        }
    }

    // Player state change handler
    window.onPlayerStateChange = function(event) {
        if (event.data === YT.PlayerState.ENDED) {
            const params = parseQueryParams();
            
            // Handle playlist progression
            if (currentPlaylist.length > 1) {
                currentVideoIndex++;
                if (currentVideoIndex >= currentPlaylist.length) {
                    if (params.loop) {
                        currentVideoIndex = 0;
                        const nextVideoId = currentPlaylist[currentVideoIndex];
                        // For shuffled playlists, start from saved position
                        if (isShuffledPlaylist) {
                            const savedTime = getSavedPosition(nextVideoId);
                            player.loadVideoById(nextVideoId, savedTime);
                        } else {
                            player.loadVideoById(nextVideoId);
                        }
                    }
                } else {
                    const nextVideoId = currentPlaylist[currentVideoIndex];
                    // For shuffled playlists, start from saved position
                    if (isShuffledPlaylist) {
                        const savedTime = getSavedPosition(nextVideoId);
                        player.loadVideoById(nextVideoId, savedTime);
                    } else {
                        player.loadVideoById(nextVideoId);
                    }
                }
            } else if (params.loop) {
                player.seekTo(0);
                player.playVideo();
            }
        }
    }

    // Start player
    window.startPlayer = async function(params) {
        console.log('Starting player with params:', params);

        // Extract video IDs and set up playlist first (before switching screens)
        const videoIds = await extractVideoIds(params.videoId);
        if (videoIds.length === 0) {
            alert('No valid video IDs found');
            return;
        }

        // Now show the player screen after playlist is loaded
        window.showPlayerScreen();
        
        // Handle shuffle mode
        if (params.position === 'shuffle' && videoIds.length > 1) {
            currentPlaylist = shuffleArray(videoIds);
            isShuffledPlaylist = true;
        } else {
            currentPlaylist = videoIds;
            isShuffledPlaylist = false;
        }
        currentVideoIndex = 0;

        // Update URL (remove edit mode when playing)
        await updateURL(params, false);

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

        // Determine start position and video index for playlist
        let startSeconds = 0;
        const actualVideoId = currentPlaylist[currentVideoIndex];
        
        if (params.position === 'saved') {
            if (currentPlaylist.length > 1) {
                const playlistKey = getPlaylistKey(currentPlaylist);
                const savedPlaylist = getSavedPlaylistPosition(playlistKey);
                currentVideoIndex = savedPlaylist.videoIndex;
                startSeconds = savedPlaylist.position;
            } else {
                startSeconds = getSavedPosition(actualVideoId);
            }
        } else if (params.position === 'shuffle') {
            // For shuffle mode, start each video from its saved position
            startSeconds = getSavedPosition(actualVideoId);
        } else if (params.position === 'random' && currentPlaylist.length > 1) {
            currentVideoIndex = Math.floor(Math.random() * currentPlaylist.length);
        }

        // Create player after screen transition
        setTimeout(() => {
            if (playerReady) {
                const videoToPlay = currentPlaylist[currentVideoIndex];
                if (params.position === 'random') {
                    // For random position, get duration first then create player
                    getRandomStartTime(videoToPlay, (randomTime) => {
                        window.createPlayer(videoToPlay, randomTime, params);
                    });
                } else {
                    window.createPlayer(videoToPlay, startSeconds, params);
                }
            } else {
                console.error('YouTube API not ready yet');
            }
        }, 100);
    }

    // Form submit handler
    playForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');

        const inputValue = videoInput.value.trim();
        
        const params = {
            videoId: inputValue,
            sleepTimer: sleepTimerSelect.value,
            loop: loopCheckbox.checked,
            position: positionSelect.value,
            title: titleInput.value.trim()
        };

        window.startPlayer(params);
    });

    // Back to main handler (edit mode)
    backToMain.addEventListener('click', async () => {
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

        // Update URL to include edit mode with current form values
        const currentParams = {
            videoId: videoInput.value.trim(),
            sleepTimer: sleepTimerSelect.value,
            loop: loopCheckbox.checked,
            position: positionSelect.value,
            title: titleInput.value.trim()
        };
        await updateURL(currentParams, true);
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

    // Reset app data handler
    resetAppButton.addEventListener('click', () => {
        if (confirm('This will delete all saved playback positions and app data. Are you sure?')) {
            // Clear all localStorage items that start with 'booktube_'
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('booktube_')) {
                    localStorage.removeItem(key);
                }
            });
            alert('App data has been reset successfully!');
            helpModal.style.display = 'none';
        }
    });

    // YouTube API callback
    window.onYouTubeIframeAPIReady = async function() {
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

    // Title input real-time update
    titleInput.addEventListener('input', () => {
        updatePageTitle(titleInput.value.trim());
    });

    // Initial load - check if we're in edit mode
    const initialParams = parseQueryParams();
    if (initialParams.videoId && initialParams.edit) {
        loadFormFromParams(initialParams);
    } else if (initialParams.title) {
        updatePageTitle(initialParams.title);
    }
});
