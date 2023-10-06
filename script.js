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
    const excludedTags = ['nav', 'footer'];
    let titles = [];
    
    let stack = [document.body];  // Start with the body element
    
    while (stack.length > 0) {
        const current = stack.pop();

        // If it's an excluded element, don't process its children
        if (!excludedTags.includes(current.tagName.toLowerCase())) {
            // If it's one of the title tags, add it to the titles array
            if (titleTags.includes(current.tagName.toLowerCase())) {
                titles.push(current);
            }
            
            // Add children to the stack to process them
            stack.push(...Array.from(current.children));
        }
    }
    
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

    const contentTexts = getTextNodesIn(contentElement)
                              .map(node => {
                                  // Print text before filtering
                                  console.log("Before decoding:", node.nodeValue);

                                  const decoded = decodeHtmlEntities(node.nodeValue);

                                  // Print text after filtering
                                  console.log("After decoding:", decoded);

                                  return decoded;
                              })
                              .join(' ');

    const utterance = new SpeechSynthesisUtterance(contentTexts);
    speechSynthesis.speak(utterance);
    return utterance;
}

function getTextNodesIn(elem) {
    let textNodes = [];
    for (let node of elem.childNodes) {
        if (node.nodeType === 3) { // text node
            textNodes.push(node);
        } else {
            textNodes = textNodes.concat(getTextNodesIn(node));
        }
    }
    return textNodes;
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

    // Convert line breaks to \n
    text = text.replace(/<br\s*\/?>/gi, '\n');

    textarea.innerHTML = text;

    // Strip out HTML tags
    text = textarea.textContent.replace(/<\/?[^>]+(>|$)/g, "");

    // Replace multiple spaces or tabs with a single space
    return text.replace(/\s+/g, ' ');
}
