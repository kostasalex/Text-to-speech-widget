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
        btn.isSpeaking = false; // track the speaking state
        
        btn.addEventListener('click', function() {
            if (btn.isSpeaking) {
                speechSynthesis.cancel(); // Stops the speaking
                togglePlayStop(btn, 'play');
                btn.isSpeaking = false;
                return;
            }

            // Speak the title
            const titleUtterance = speakTitle(btn);
            togglePlayStop(btn, 'stop');
            btn.isSpeaking = true;

            // When the title speaking ends, speak the content
            titleUtterance.onend = function() {
                const contentUtterance = speakContent(btn);
                contentUtterance.onend = function() {
                    togglePlayStop(btn, 'play');
                    btn.isSpeaking = false;
                };
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

function speakContent(button) {
    const contentElement = button.nextElementSibling; 
    const contentTexts = Array.from(contentElement.querySelectorAll('p, li, a'))
                              .map(el => decodeHtmlEntities(el.innerHTML))
                              .join(' ');
    console.log(contentTexts);
    const utterance = new SpeechSynthesisUtterance(contentTexts);
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

function decodeHtmlEntities(text) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    // Strip out HTML tags
    return textarea.textContent.replace(/<\/?[^>]+(>|$)/g, "");
}
