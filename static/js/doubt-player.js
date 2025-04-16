document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const youtubeUrlInput = document.getElementById('youtubeUrl');
    const goBtn = document.getElementById('goBtn');
    const videoContainer = document.getElementById('videoContainer');
    const videoPlayer = document.getElementById('videoPlayer');
    
    // Configuration
    const PROXY_SERVER = 'https://youtube-proxy-2is6.onrender.com/proxy-youtube';
    const LOAD_TIMEOUT = 10000; // 10 seconds timeout

    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'yt-loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="spinner"></div>
        <p>Loading video...</p>
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
            videoContainer.style.display = 'none';
            videoPlayer.src = '';
            
            // Prepare iframe URL with security parameters
            const iframeUrl = new URL(PROXY_SERVER);
            iframeUrl.searchParams.append('v', videoId);
            iframeUrl.searchParams.append('autoplay', '1');
            iframeUrl.searchParams.append('modestbranding', '1');
            iframeUrl.searchParams.append('rel', '0');
            iframeUrl.searchParams.append('enablejsapi', '1');
            
            console.debug('Loading YouTube video:', {
                videoId: videoId,
                proxyUrl: iframeUrl.toString(),
                timestamp: new Date().toISOString()
            });
            
            // Set up timeout
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Video load timeout')), LOAD_TIMEOUT));
            
            // Load video with timeout protection
            videoPlayer.src = iframeUrl.toString();
            
            await Promise.race([
                new Promise((resolve) => { videoPlayer.onload = resolve; }),
                timeoutPromise
            ]);
            
            // Force iframe reload (as requested)
            try {
                if (videoPlayer.contentWindow) {
                    videoPlayer.contentWindow.location.reload(true);
                }
            } catch (e) {
                console.warn('Soft reload failed:', e.message);
            }
            
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
            
            loadingIndicator.style.display = 'none';
            videoContainer.style.display = 'none';
            
            alert(`Failed to load video:\n${error.message}\n\nPlease check:
1. The URL is correct (${youtubeUrlInput.value.trim() || 'empty'})
2. The video is available
3. Your network connection
4. Proxy server is running (${PROXY_SERVER})`);
            
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