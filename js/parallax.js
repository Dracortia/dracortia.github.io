document.addEventListener('DOMContentLoaded', function () {
    var parallaxContainer = document.querySelector('.parallax-container');
    var parallaxVideo = document.querySelector('.parallax-video');
    var textOverlay = document.querySelector('.text-overlay');

    if (parallaxContainer && parallaxVideo && textOverlay) {
        window.addEventListener('scroll', function () {
            var scrollPosition = window.scrollY;

            // Adjust the vertical position of the video with a parallax effect
            parallaxVideo.style.transform = 'translateY(' + scrollPosition * 0.5 + 'px)';

            // Adjust the vertical position of the text with a parallax effect
            textOverlay.style.transform = 'translateY(' + scrollPosition * 0.3 + 'px)';

            // Apply a more subtle zooming effect to the video
            var zoomFactor = 1 + scrollPosition * 0.0001;
            parallaxVideo.style.transform += ' scale(' + zoomFactor + ')';
        });
    }
});
