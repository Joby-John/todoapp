document.addEventListener('DOMContentLoaded', function() {
    const youtubeUrlInput = document.getElementById('youtubeUrl');
    const goBtn = document.getElementById('goBtn');
    const videoContainer = document.getElementById('videoContainer');
    const videoPlayer = document.getElementById('videoPlayer');
    
    // Configuration - Update this with your Render proxy URL
    const PROXY_SERVER = 'https://youtube-proxy-2is6.onrender.com';
    
    // Function to extract YouTube video ID from URL (handles all URL formats)
    function getYouTubeId(url) {
        // First decode any URL-encoded characters
        try {
            url = decodeURIComponent(url);
        } catch (e) {
            console.warn('URL decoding error, using original URL');
        }
        
        // Comprehensive regex for all YouTube URL formats
        const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|watch\?.+&v=|shorts\/|live\/)([^#&?]*).*/;
        const match = url.match(regExp);
        
        return (match && match[2].length === 11) ? match[2] : null;
    }

    // Function to validate and clean the input URL
    function validateYouTubeUrl(url) {
        url = url.trim();
        
        // Basic validation
        if (!url) {
            return {
                valid: false,
                message: 'Please enter a YouTube URL'
            };
        }
        
        // Check if it's a YouTube URL
        if (!/youtu(?:be\.com|\.be)/i.test(url)) {
            return {
                valid: false,
                message: 'Please enter a valid YouTube URL\n\nExamples:\n' +
                         '• https://www.youtube.com/watch?v=dQw4w9WgXcQ\n' +
                         '• https://youtu.be/dQw4w9WgXcQ\n' +
                         '• youtube.com/shorts/VIDEO_ID'
            };
        }
        
        return { valid: true, url: url };
    }

    // Function to load the YouTube video through proxy
    function loadYouTubeVideo() {
        const validation = validateYouTubeUrl(youtubeUrlInput.value);
        if (!validation.valid) {
            alert(validation.message);
            youtubeUrlInput.focus();
            return;
        }
        
        const videoId = getYouTubeId(validation.url);
        if (!videoId) {
            alert('Could not extract video ID. Please check the URL format.');
            return;
        }
        
        // Load through proxy with enhanced parameters
        videoPlayer.src = `${PROXY_SERVER}?v=${videoId}&autoplay=1&rel=0&modestbranding=1`;
        videoContainer.style.display = 'block';
        
        // Smooth scroll to video
        videoContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // Focus the iframe for better keyboard control
        setTimeout(() => videoPlayer.focus(), 500);
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
        }
    });
    
    // Auto-focus input on page load for better UX
    setTimeout(() => youtubeUrlInput.focus(), 100);
    
    // Error handling for iframe
    videoPlayer.addEventListener('error', function() {
        alert('Error loading video. Please check:\n' +
              '1. The URL is correct\n' +
              '2. The video isn\'t private/restricted\n' +
              '3. Your internet connection is stable');
    });
});