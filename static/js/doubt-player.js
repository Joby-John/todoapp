document.addEventListener('DOMContentLoaded', function() {
    const youtubeUrlInput = document.getElementById('youtubeUrl');
    const goBtn = document.getElementById('goBtn');
    const videoContainer = document.getElementById('videoContainer');
    const videoPlayer = document.getElementById('videoPlayer');

    // Function to extract YouTube video ID from URL (handles encoded URLs)
    function getYouTubeId(url) {
        // First decode any URL-encoded characters
        try {
            url = decodeURIComponent(url);
        } catch (e) {
            // If decoding fails, proceed with original URL
            console.log('URL decoding error, using original URL');
        }
        
        // Updated regex pattern to handle various YouTube URL formats
        const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|watch\?.+&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        
        return (match && match[2].length === 11) ? match[2] : null;
    }

    // Function to validate and clean the YouTube URL
    function cleanYouTubeUrl(url) {
        // Remove any URL-encoded characters
        try {
            url = decodeURIComponent(url);
        } catch (e) {
            // If decoding fails, return original
            return url;
        }
        
        // Fix common URL issues
        url = url.replace(/\?/g, '&').replace(/&+/, '&');
        
        // Ensure it starts with http
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        
        return url;
    }

    // Function to load the YouTube video
    function loadYouTubeVideo() {
        let url = youtubeUrlInput.value.trim();
        url = cleanYouTubeUrl(url);
        
        const videoId = getYouTubeId(url);

        if (videoId) {
            videoPlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
            videoContainer.style.display = 'block';
            
            // Scroll to the video player for better UX
            videoContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            alert('Please enter a valid YouTube URL. Examples:\n\n' + 
                  '• https://www.youtube.com/watch?v=lHvFb1buP54\n' +
                  '• https://youtu.be/lHvFb1buP54');
            youtubeUrlInput.focus();
        }
    }

    // Event listener for GO button click
    goBtn.addEventListener('click', loadYouTubeVideo);

    // Event listener for Enter key press
    youtubeUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loadYouTubeVideo();
        }
    });

    // Clear video when input is cleared
    youtubeUrlInput.addEventListener('input', function() {
        if (!this.value.trim()) {
            videoPlayer.src = '';
            videoContainer.style.display = 'none';
        }
    });
});