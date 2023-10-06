document.addEventListener("DOMContentLoaded", function() {
    // Get all players for the upcoming extensions.
    const playerButtons = document.querySelectorAll('.player-button');
    
    playerButtons.forEach(function(playerButton) {
        const playIcon = playerButton.querySelector('.play-icon');
        const stopIcon = playerButton.querySelector('.stop-icon');

        playerButton.addEventListener('click', function() {
            // Toggle play/stop
            if (playIcon.style.display === 'block') {
                playIcon.style.display = 'none';
                stopIcon.style.display = 'block';
      
            } else {
                stopIcon.style.display = 'none';
                playIcon.style.display = 'block';
              
            }
        });
    });
});
