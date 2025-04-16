document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const youtubeUrlInput = document.getElementById('youtubeUrl');
    const goBtn = document.getElementById('goBtn');
    const videoContainer = document.getElementById('videoContainer');
    let videoPlayer = document.getElementById('videoPlayer');
    
    // Configuration
    const PROXY_SERVER = 'https://youtube-proxy-2is6.onrender.com/proxy-youtube';
    const LOAD_TIMEOUT = 15000; // 15 seconds timeout
    const ALLOWED_DOMAINS = ['yourwebsite.com', 'todoapp-babe.onrender.com'];

    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'yt-loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="spinner"></div>
        <p>Loading video...</p>
        <div class="browser-warning" style="display:none; margin-top:10px;">
            <p>If video doesn't load, try:</p>
            <button class="reload-btn">Reload Video</button>
            <button class="open-new-btn">Open in New Tab</button>
        </div>
    `;
    videoContainer.parentNode.insertBefore(loadingIndicator, videoContainer);

    // Add custom styles
    const style = document.createElement('style');
    style.textContent = `
        .yt-loading-indicator {
            padding: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 8px;
            text-align: center;
            margin: 10px 0;
            display: none;
        }
        .yt-loading-indicator .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid #fff;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        .yt-loading-indicator .browser-warning {
            background: rgba(255,255,255,0.2);
            padding: 10px;
            border-radius: 5px;
            margin-top: 15px;
        }
        .yt-loading-indicator .browser-warning button {
            margin: 5px;
            padding: 5px 10px;
            background: #e91e63;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Enhanced YouTube ID extraction
    function getYouTubeId(url) {
        if (!url) return null;
        
        try {
            url = decodeURIComponent(url);
            // Handle mobile/weird URLs
            url = url.replace('m.youtube.com', 'youtube.com')
                     .replace('youtube.com/shorts/', 'youtube.com/watch?v=');
        } catch (e) {
            console.warn('URL decode error:', e);
        }
        
        const patterns = [
            /youtu\.be\/([^#&?]{11})/,       // youtu.be/id
            /[?&]v=([^#&?]{11})/,            // ?v=id
            /embed\/([^#&?]{11})/,           // embed/id
            /\/v\/([^#&?]{11})/,             // /v/id
            /shorts\/([^#&?]{11})/,          // shorts/id
            /watch\?.+&v=([^#&?]{11})/       // watch?v=id with other params
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) return match[1];
        }
        
        return null;
    }

    // Advanced URL validation
    function validateYouTubeUrl(url) {
        url = (url || '').trim();
        
        if (!url) {
            return {
                valid: false,
                message: 'Please enter a YouTube video URL'
            };
        }
        
        // Basic URL format check
        if (!/(youtube\.com|youtu\.be)/i.test(url)) {
            return {
                valid: false,
                message: 'Invalid YouTube URL. Examples:\n' +
                        '• https://youtube.com/watch?v=VIDEO_ID\n' +
                        '• https://youtu.be/VIDEO_ID\n' +
                        '• youtube.com/shorts/VIDEO_ID'
            };
        }
        
        return { valid: true, url: url };
    }

    // Browser detection
    function getBrowserSpecificConfig() {
        const userAgent = navigator.userAgent;
        const isChrome = /Chrome/.test(userAgent);
        const isFirefox = /Firefox/.test(userAgent);
        
        return {
            sandboxAttrs: isChrome ? 
                'allow-same-origin allow-scripts allow-popups allow-presentation' :
                'allow-same-origin allow-scripts allow-popups',
            needsDelayedLoad: isChrome || isFirefox,
            loadDelay: isFirefox ? 150 : 100 // Firefox needs slightly longer delay
        };
    }

    // Video loading with comprehensive error handling
    async function loadYouTubeVideo() {
        try {
            // Validate input
            const validation = validateYouTubeUrl(youtubeUrlInput.value);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            
            // Extract video ID
            const videoId = getYouTubeId(validation.url);
            if (!videoId || videoId.length !== 11) {
                throw new Error('Invalid video ID format (must be 11 characters)');
            }
            
            // Show loading state
            loadingIndicator.style.display = 'block';
            loadingIndicator.querySelector('.browser-warning').style.display = 'none';
            videoContainer.style.display = 'none';
            
            // Get browser-specific configuration
            const browserConfig = getBrowserSpecificConfig();
            
            // Create new iframe with browser-specific attributes
            const newIframe = document.createElement('iframe');
            newIframe.className = 'video-iframe';
            newIframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            newIframe.allowFullscreen = true;
            newIframe.setAttribute('sandbox', browserConfig.sandboxAttrs);
            
            // Replace existing iframe
            videoPlayer.replaceWith(newIframe);
            videoPlayer = newIframe;
            
            // Prepare iframe URL with security parameters
            const iframeUrl = new URL(PROXY_SERVER);
            iframeUrl.searchParams.append('v', videoId);
            iframeUrl.searchParams.append('autoplay', '1');
            iframeUrl.searchParams.append('modestbranding', '1');
            iframeUrl.searchParams.append('rel', '0');
            iframeUrl.searchParams.append('enablejsapi', '1');
            iframeUrl.searchParams.append('origin', window.location.origin);
            
            console.debug('Loading YouTube video:', {
                videoId: videoId,
                proxyUrl: iframeUrl.toString(),
                browserConfig: browserConfig,
                timestamp: new Date().toISOString()
            });
            
            // Browser-specific loading workaround
            if (browserConfig.needsDelayedLoad) {
                videoPlayer.src = '';
                await new Promise(resolve => setTimeout(resolve, browserConfig.loadDelay));
            }
            
            // Set the final URL
            videoPlayer.src = iframeUrl.toString();
            
            // Wait for video to load or timeout
            await Promise.race([
                new Promise(resolve => { videoPlayer.onload = resolve; }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Load timeout')), LOAD_TIMEOUT))
            ]);
            
            // Show video
            videoContainer.style.display = 'block';
            loadingIndicator.style.display = 'none';
            
            // Scroll to video smoothly
            videoContainer.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
            
        } catch (error) {
            console.error('Video load failed:', {
                error: error.message,
                input: youtubeUrlInput.value,
                timestamp: new Date().toISOString()
            });
            
            loadingIndicator.style.display = 'block';
            loadingIndicator.querySelector('.browser-warning').style.display = 'block';
            videoContainer.style.display = 'none';
            
            // Set up retry buttons
            loadingIndicator.querySelector('.reload-btn').onclick = loadYouTubeVideo;
            loadingIndicator.querySelector('.open-new-btn').onclick = () => {
                window.open(`https://www.youtube.com/watch?v=${getYouTubeId(youtubeUrlInput.value.trim())}`, '_blank');
            };
            
            youtubeUrlInput.focus();
        }
    }

    // Event Listeners
    goBtn.addEventListener('click', loadYouTubeVideo);
    
    youtubeUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') loadYouTubeVideo();
    });
    
    youtubeUrlInput.addEventListener('input', function() {
        if (!this.value.trim()) {
            videoPlayer.src = '';
            videoContainer.style.display = 'none';
            loadingIndicator.style.display = 'none';
        }
    });
    
    // Auto-focus input on load
    setTimeout(() => {
        youtubeUrlInput.focus();
        console.log('YouTube player initialized', {
            proxyServer: PROXY_SERVER,
            userAgent: navigator.userAgent,
            readyState: document.readyState
        });
    }, 100);
    
    // Enhanced error handling
    videoPlayer.addEventListener('error', function(e) {
        console.error('Iframe error event:', {
            error: e,
            src: videoPlayer.src,
            readyState: videoPlayer.readyState,
            timestamp: new Date().toISOString()
        });
    });
});