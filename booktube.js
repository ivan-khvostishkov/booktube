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
    const timerResetSelect = document.getElementById('timerResetSelect');
    const titleInput = document.getElementById('titleInput');
    const resetAppButton = document.getElementById('resetAppButton');
    const exportButton = document.getElementById('exportButton');
    const importButton = document.getElementById('importButton');
    const importFile = document.getElementById('importFile');
    const favoritesIcon = document.getElementById('favoritesIcon');
    const favoritesScreen = document.getElementById('favoritesScreen');
    const closeFavorites = document.getElementById('closeFavorites');
    const backFromFavorites = document.getElementById('backFromFavorites');
    const favoritesList = document.getElementById('favoritesList');
    const saveToFavoritesCheckbox = document.getElementById('saveToFavorites');

    // Set current year
    currentYearSpan.textContent = new Date().getFullYear();

    // Video input info tooltip
    const videoInputInfo = document.getElementById('videoInputInfo');
    videoInputInfo.addEventListener('click', () => {
        alert('Supports video IDs, URLs, playlist IDs (PLxxx), space-separated');
    });

    // Default favorites list
    const defaultFavorites = [
        { v: 'NSfkgr5TTYM yPnhdK9touU YjvTqHfFqEc', sleep: '20', loop: false, pos: 'saved', title: 'Сумма технологии. Станислав Лем' },
        { v: 'zHtvJj5bgoo', sleep: '45', loop: false, pos: 'saved', title: 'The Aeneid by Virgil' },
        { v: 'PLQ7iliSaUiA_KHmGhRd4HpuuPM37UGSE_', sleep: '20', loop: false, pos: 'saved', title: 'История. Геродот' },
        { v: 'gKg0W5Un0PI', sleep: '20', loop: false, pos: 'saved', title: 'Дао дэ цзин. Лао-цзы' },
        { v: 'PLjPg58THfX_yQrAgXoShepHoDLtOVeKWh', sleep: '20', loop: false, pos: 'saved', title: 'Махабхарата' },
        { v: 'ZQwrt4R4XDw', sleep: '20', loop: false, pos: 'saved', title: 'Колыбель для кошки. Курт Воннегут' },
        { v: 'IIEJNUO1BoQ', sleep: '15', loop: false, pos: 'saved', title: 'The Bhagavad Gita, The Lord\'s Song' },
        { v: 'vS4ble0Uznk', sleep: '20', loop: false, pos: 'saved', title: 'Siddhartha By Hermann Hesse' },
        { v: 'PLe7ZwSHgdjYJdfNOkOrHznkN2yyT5eJpm', sleep: '20', loop: false, pos: 'saved', title: 'Das Glasperlenspiel von Hermann Hesse' },
        { v: 'X35eeaG9W98', sleep: '20', loop: false, pos: 'saved', title: 'The Epic Of Gilgamesh' },
        { v: 'PL-lY2fdb59Of61NGdOmXUagd0f1B_RUXC', sleep: '20', loop: false, pos: 'saved', title: 'The Master and Margarita by Mikhail Bulgakov' },
        { v: 'HeyRm9WubQ0 6OpKJYYvooE', sleep: '20', loop: false, pos: 'saved', title: 'One Hundred Years of Solitude. Gabriel García Márquez' },
        { v: '-H3IjANl0V4 BR0k8I8i28U', sleep: '30', loop: false, pos: 'saved', title: 'Наши за границей. Николай Лейкин (Gennady Anatolievich)' },
        { v: 'zmJjMlPcMfs 0dqnYl-9jDc', sleep: '20', loop: false, pos: 'saved', title: 'Дзэн и искусство ухода за мотоциклом. Роберт Пёрсиг' },
        { v: 'PL5E0m9KbufwZlALCgXRHyoE99VeORMmzr', sleep: '30', loop: false, pos: 'random', title: 'Тысяча и одна ночь. Сказки' },
        { v: 'nwRoHC83wx0', sleep: '45', loop: true, pos: 'random', title: 'Gayatri Mantra – Rig Veda 3.62.10' },
        { v: 'PLAQ6vzFKj_1uqRv3OCX-Elexz9C8vfENs', sleep: '20', loop: false, pos: 'shuffle', title: 'The Stories of Mahabharata' },
        { v: 'PLb-JKoHS0AMAJ1gApOJOxuZoLsGZPLWqc', sleep: '30', loop: false, pos: 'shuffle', title: '"Модель для сборки". Радиопрограмма' },
        { v: 'PLTMnNOWf9hrpvVf_1JksytDPOmjh0JJpE', sleep: '30', loop: false, pos: 'shuffle', title: 'Сборник аудиокниг (Gennady Anatolievich)' }
    ];

    // Favorites management
    function getFavorites() {
        const stored = localStorage.getItem('booktube_favorites');
        return stored ? JSON.parse(stored) : defaultFavorites;
    }

    function saveFavorites(favorites) {
        localStorage.setItem('booktube_favorites', JSON.stringify(favorites));
    }

    function addToFavorites(item) {
        const favorites = getFavorites();
        const exists = favorites.some(fav => fav.v === item.v && fav.title === item.title);
        if (!exists) {
            favorites.push(item);
            saveFavorites(favorites);
        }
    }

    function removeFromFavorites(index) {
        const favorites = getFavorites();
        favorites.splice(index, 1);
        saveFavorites(favorites);
        renderFavorites();
    }

    function resetFavorites() {
        saveFavorites(defaultFavorites);
        renderFavorites();
    }

    function renderFavorites() {
        const favorites = getFavorites();
        favoritesList.innerHTML = '';
        
        favorites.forEach((fav, index) => {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            
            const info = document.createElement('div');
            info.className = 'favorite-info';
            info.innerHTML = `
                <div class="favorite-title">${fav.title}</div>
                <div class="favorite-details">${fav.sleep === '0' ? 'No timer' : fav.sleep + ' min'} • ${fav.loop ? 'Loop' : 'No loop'} • ${fav.pos}</div>
            `;
            
            const deleteBtn = document.createElement('i');
            deleteBtn.className = 'fas fa-trash favorite-delete';
            deleteBtn.onclick = () => removeFromFavorites(index);
            
            info.onclick = async () => {
                // Convert + back to spaces for the form input
                videoInput.value = fav.v.replace(/\+/g, ' ');
                sleepTimerSelect.value = fav.sleep;
                loopCheckbox.checked = fav.loop;
                positionSelect.value = fav.pos;
                titleInput.value = fav.title;
                updatePageTitle(fav.title);
                
                // Update URL with the selected favorite's parameters
                const params = {
                    videoId: fav.v.replace(/\+/g, ' '),
                    sleepTimer: fav.sleep,
                    loop: fav.loop,
                    position: fav.pos,
                    title: fav.title
                };
                await updateURL(params, true);
                
                showMainScreen();
            };
            
            item.appendChild(info);
            item.appendChild(deleteBtn);
            favoritesList.appendChild(item);
        });
    }

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

    // Convert URLs to video IDs for URL parameter
    function convertToVideoIds(input) {
        console.log('convertToVideoIds input:', input);
        // Split by both spaces and + signs
        const ids = input.trim().split(/[\s+]+/);
        console.log('convertToVideoIds split ids:', ids);
        const videoRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const playlistRegex = /(?:youtube\.com\/.*[?&]list=|youtube\.com\/playlist\?list=)([a-zA-Z0-9_-]+)/;
        
        const results = [];
        
        for (const id of ids) {
            console.log('Processing id:', id, 'length:', id.length);
            // Check if it's a playlist ID or URL
            const playlistMatch = id.match(playlistRegex);
            if (playlistMatch || (id.length > 11 && id.startsWith('PL'))) {
                const playlistId = playlistMatch ? playlistMatch[1] : id;
                console.log('Found playlist:', playlistId);
                results.push(playlistId);
            } else {
                // Handle single video ID or URL
                const videoMatch = id.match(videoRegex);
                if (videoMatch) {
                    console.log('Found video from URL:', videoMatch[1]);
                    results.push(videoMatch[1]);
                } else if (id.length === 11) {
                    // It's already a video ID
                    console.log('Found video ID:', id);
                    results.push(id);
                } else {
                    console.log('Skipping invalid ID:', id);
                }
            }
        }
        
        console.log('convertToVideoIds results:', results);
        const result = results.join(' ');
        console.log('convertToVideoIds final result:', result);
        return result;
    }
    
    // Multiple proxy services for fallback with rate limiting awareness
    const proxyServices = [
        'https://corsproxy.io/?',
        'https://cors-anywhere.herokuapp.com/',
        'https://api.allorigins.win/raw?url=',
    ];

    // Show/hide loading indicator
    function showLoading() {
        const indicator = document.getElementById('loadingIndicator');
        indicator.classList.add('active');
        // Force reflow to restart animation
        indicator.offsetHeight;
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
            for (let i = 1; i <= 20; i++) {
                console.log(`Starting batch ${i} - waiting 250ms before request...`);
                await new Promise(resolve => setTimeout(resolve, 250)); // in ms, delay between requests
                
                console.log(`Batch ${i}: Calling fetchMorePlaylistVideos...`);
                const moreVideos = await fetchMorePlaylistVideos(playlistId, proxyUrl, i, videoIds);
                console.log(`Batch ${i}: Received ${moreVideos.length} videos from fetchMorePlaylistVideos`);
                
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
                
                console.log(`Batch ${i} completed successfully`);
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
    async function fetchMorePlaylistVideos(playlistId, proxyUrl, round, knownVideoIds, retries = 3) {
        console.log(`fetchMorePlaylistVideos called: round=${round}, retries=${retries}`);
        const allVideos = [];
        const seenIds = new Set();
        
        // Use different URL patterns to get more coverage
        const urls = [];
        
        // Create URLs with proper video IDs for the corresponding indices
        const indices = [round * 50 + 1, round * 100 + 1];
        indices.forEach(index => {
            const videoId = knownVideoIds && knownVideoIds[index - 1]; // index is 1-based, array is 0-based
            if (videoId) {
                const url = `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}&index=${index}`;
                urls.push(url);
                console.log(`Created URL for index ${index}: ${url}`);
            } else {
                console.log(`No video ID available for index ${index}`);
            }
        });
        
        console.log(`Trying ${urls.length} different URL patterns...`);
        
        for (let urlIndex = 0; urlIndex < urls.length; urlIndex++) {
            const url = urls[urlIndex];
            console.log(`URL ${urlIndex + 1}/${urls.length}: Attempting to fetch: ${url}`);
            
            for (let attempt = 0; attempt < retries; attempt++) {
                console.log(`  Attempt ${attempt + 1}/${retries} for URL ${urlIndex + 1}`);
                try {
                    console.log(`  Making fetch request to: ${proxyUrl + encodeURIComponent(url)}`);
                    const response = await fetch(proxyUrl + encodeURIComponent(url));
                    console.log(`  Response received: status=${response.status}`);
                    
                    if (response.status === 429) {
                        // Rate limited, wait longer
                        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                        console.log(`  Rate limited, waiting ${delay}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        console.log(`  Wait completed, continuing to next attempt`);
                        continue;
                    }
                    
                    if (!response.ok) {
                        console.log(`  Response not OK (${response.status}), trying next URL`);
                        break; // Try next URL
                    }
                    
                    console.log(`  Reading response text...`);
                    const content = await response.text();
                    console.log(`  Content received, length: ${content.length}`);
                    
                    // Extract video IDs using the same patterns
                    const patterns = [
                        /"videoId":"([a-zA-Z0-9_-]{11})"/g,
                        /"watchEndpoint":{"videoId":"([a-zA-Z0-9_-]{11})"/g,
                        /\/watch\?v=([a-zA-Z0-9_-]{11})/g
                    ];
                    
                    console.log(`  Extracting video IDs using ${patterns.length} patterns...`);
                    patterns.forEach((pattern, patternIndex) => {
                        let match;
                        let patternMatches = 0;
                        while ((match = pattern.exec(content)) !== null) {
                            const videoId = match[1];
                            if (videoId && videoId.length === 11 && !seenIds.has(videoId)) {
                                seenIds.add(videoId);
                                allVideos.push(videoId);
                                patternMatches++;
                            }
                        }
                        if (patternMatches > 0) {
                            console.log(`    Pattern ${patternIndex + 1}: Found ${patternMatches} new videos`);
                        }
                    });
                    
                    console.log(`  URL ${urlIndex + 1} completed successfully, found ${allVideos.length} total videos so far`);
                    break; // Success, move to next URL
                    
                } catch (error) {
                    console.log(`  Attempt ${attempt + 1} failed:`, error.message);
                    if (attempt === retries - 1) {
                        console.log(`  All ${retries} attempts failed for URL ${urlIndex + 1}`);
                    }
                }
            }
        }
        
        console.log(`fetchMorePlaylistVideos completed: returning ${allVideos.length} videos`);
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
                return videoIds;
            } catch (error) {
                console.error(`RSS proxy ${i + 1} failed:`, error);
                if (i < proxyServices.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
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
            position: params.get('pos') || 'saved',
            edit: params.get('edit') === 'true',
            title: params.get('title') || ''
        };
    }

    // Update URL with parameters
    async function updateURL(params, includeEdit = false) {
        const url = new URL(window.location);
        
        url.searchParams.set('v', convertToVideoIds(params.videoId));
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

    // Get random video index (true random, not shuffled)
    function getRandomVideoIndex(arrayLength, excludeIndex = -1) {
        if (arrayLength <= 1) return 0;
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * arrayLength);
        } while (randomIndex === excludeIndex && arrayLength > 1);
        return randomIndex;
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
        playerScreen.classList.remove('active');
        favoritesScreen.classList.remove('active');
        mainScreen.classList.add('active');
        hideLoading();
    }

    // Switch to favorites screen
    function showFavoritesScreen() {
        console.log('Switching to favorites screen');
        console.log('favoritesScreen element:', favoritesScreen);
        console.log('Before - favoritesScreen classes:', favoritesScreen.className);
        mainScreen.classList.remove('active');
        playerScreen.classList.remove('active');
        favoritesScreen.classList.add('active');
        console.log('After - favoritesScreen classes:', favoritesScreen.className);
        console.log('favoritesScreen computed style:', window.getComputedStyle(favoritesScreen).display);
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

        // Start position saving if not random or beginning
        if (params.position !== 'random' && params.position !== 'beginning') {
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
                if (isShuffledPlaylist) {
                    // True random: pick any video (including current one)
                    currentVideoIndex = getRandomVideoIndex(currentPlaylist.length);
                } else {
                    // Sequential: go to next video
                    currentVideoIndex++;
                    if (currentVideoIndex >= currentPlaylist.length) {
                        if (params.loop) {
                            currentVideoIndex = 0;
                        } else {
                            return; // End of playlist
                        }
                    }
                }
                
                const nextVideoId = currentPlaylist[currentVideoIndex];
                if (isShuffledPlaylist) {
                    const savedTime = getSavedPosition(nextVideoId);
                    player.loadVideoById(nextVideoId, savedTime);
                } else {
                    player.loadVideoById(nextVideoId);
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
        
        // Set up playlist (no pre-shuffling for random mode)
        currentPlaylist = videoIds;
        isShuffledPlaylist = params.position === 'shuffle';
        if (isShuffledPlaylist) {
            console.log('Random mode enabled for', currentPlaylist.length, 'videos');
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
            // For shuffle mode, pick random video and start from saved position
            currentVideoIndex = getRandomVideoIndex(currentPlaylist.length);
            startSeconds = getSavedPosition(currentPlaylist[currentVideoIndex]);
        } else if (params.position === 'random' && currentPlaylist.length > 1) {
            currentVideoIndex = getRandomVideoIndex(currentPlaylist.length);
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

        // Save to favorites if checkbox is checked
        if (saveToFavoritesCheckbox.checked) {
            addToFavorites({
                v: params.videoId,
                sleep: params.sleepTimer,
                loop: params.loop,
                pos: params.position,
                title: params.title || 'ID: ' + params.videoId
            });
        }

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

        // Clear sleep timer and hide overlay
        sleepTimerEndTime = null;
        sleepTimerOverlay.classList.remove('active', 'warning');

        // Destroy player
        if (player && player.destroy) {
            player.destroy();
            player = null;
        }

        // Clear the player div
        document.getElementById('youtubePlayer').innerHTML = '';

        // Hide player screen properly
        playerScreen.style.display = 'none';

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

    // Favorites screen handlers
    if (favoritesIcon) {
        favoritesIcon.addEventListener('click', () => {
            console.log('Favorites icon clicked');
            renderFavorites();
            showFavoritesScreen();
        });
    } else {
        console.error('Favorites icon not found');
    }

    if (closeFavorites) {
        closeFavorites.addEventListener('click', () => {
            showMainScreen();
        });
    }

    if (backFromFavorites) {
        backFromFavorites.addEventListener('click', () => {
            showMainScreen();
        });
    }

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

    // Escape key handler for closing modals and screens
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close help modal if open
            if (helpModal.style.display === 'block') {
                helpModal.style.display = 'none';
            }
            // Close favorites screen if active
            else if (favoritesScreen.classList.contains('active')) {
                showMainScreen();
            }
        }
    });

    // Export settings handler
    exportButton.addEventListener('click', (e) => {
        e.preventDefault();
        const data = {};
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('booktube_')) {
                data[key] = localStorage.getItem(key);
            }
        });
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `booktube-settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // Import settings handler
    importButton.addEventListener('click', (e) => {
        e.preventDefault();
        importFile.click();
    });

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    Object.keys(data).forEach(key => {
                        if (key.startsWith('booktube_')) {
                            localStorage.setItem(key, data[key]);
                        }
                    });
                    renderFavorites();
                    alert('Settings imported successfully!');
                    helpModal.style.display = 'none';
                } catch (error) {
                    alert('Invalid file format. Please select a valid BookTube settings file.');
                }
            };
            reader.readAsText(file);
        }
        e.target.value = '';
    });

    // Reset app data handler
    resetAppButton.addEventListener('click', () => {
        if (confirm('This will delete all saved playback positions and reset favorites to default. Are you sure?')) {
            // Clear all localStorage items that start with 'booktube_'
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('booktube_')) {
                    localStorage.removeItem(key);
                }
            });
            resetFavorites();
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

    // Sleep timer reset functionality
    sleepTimerOverlay.addEventListener('click', (e) => {
        if (e.target === timerResetSelect) return; // Don't toggle when clicking select
        sleepTimerOverlay.classList.toggle('show-select');
    });

    timerResetSelect.addEventListener('change', (e) => {
        const newMinutes = parseInt(e.target.value);
        
        // Clear existing timer
        if (sleepTimerTimeout) {
            clearTimeout(sleepTimerTimeout);
        }
        
        // Set new timer
        sleepTimerEndTime = Date.now() + (newMinutes * 60 * 1000);
        
        // Set new timeout
        sleepTimerTimeout = setTimeout(() => {
            if (player && player.pauseVideo) {
                player.pauseVideo();
            }
            sleepTimerOverlay.classList.remove('active');
            clearInterval(sleepTimerInterval);
        }, newMinutes * 60 * 1000);
        
        // Hide select dropdown
        sleepTimerOverlay.classList.remove('show-select');
        
        // Update display immediately
        updateSleepTimerDisplay();
    });

    // Hide timer select when clicking outside
    document.addEventListener('click', (e) => {
        if (!sleepTimerOverlay.contains(e.target)) {
            sleepTimerOverlay.classList.remove('show-select');
        }
    });

    // Initial load - check if we're in edit mode
    const initialParams = parseQueryParams();
    if (initialParams.videoId && initialParams.edit) {
        loadFormFromParams(initialParams);
    } else if (initialParams.title) {
        updatePageTitle(initialParams.title);
    }
});
