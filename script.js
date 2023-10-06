document.addEventListener("DOMContentLoaded", function() {
    renderPlayer();
});

function renderPlayer() {
    const titles = getPotentialTitleElements();
    renderPlayerButtons(titles);
    addPlayButtonEventListener();
}

function getPotentialTitleElements() {
    const titleTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    let titles = [];
    titleTags.forEach(tag => {
        const elements = document.querySelectorAll(tag);
        titles = [...titles, ...elements];
    });
    return titles;
}

function renderPlayerButtons(titles) {
    titles.forEach(title => {
        const btn = document.createElement("button");
        btn.classList.add("player-button");

        const playIcon = document.createElement("span");
        playIcon.classList.add("play-icon");
        
        const stopIcon = document.createElement("span");
        stopIcon.classList.add("stop-icon");
        stopIcon.style.display = "none"; // Initially hidden

        btn.appendChild(playIcon);
        btn.appendChild(stopIcon);
        
        title.parentNode.insertBefore(btn, title.nextSibling);
    });
}

function addPlayButtonEventListener() {
    const buttons = document.querySelectorAll(".player-button");
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Speak the title
            const utterance = speakTitle(btn);

            // Toggle to stop icon when speaking starts
            togglePlayStop(btn, 'stop');

            // Add event listener to toggle back to play icon when speaking ends
            utterance.onend = function() {
                togglePlayStop(btn, 'play');
            };
        });
    });
}

function speakTitle(button) {
    const title = button.previousSibling.textContent;
    const utterance = new SpeechSynthesisUtterance(title);
    speechSynthesis.speak(utterance);
    return utterance;
}

function togglePlayStop(button, state) {
    const playIcon = button.querySelector('.play-icon');
    const stopIcon = button.querySelector('.stop-icon');

    if (state === 'play') {
        playIcon.style.display = 'block';
        stopIcon.style.display = 'none';
    } else if (state === 'stop') {
        playIcon.style.display = 'none';
        stopIcon.style.display = 'block';
    }
}
