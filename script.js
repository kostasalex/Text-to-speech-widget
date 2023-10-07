document.addEventListener("DOMContentLoaded", function() {
    
    renderPlayer();
});

function renderPlayer() {
    injectStyles(PLAYER_STYLES);
    const titles = getPotentialTitleElements();
    renderPlayerButtons(titles);
    addPlayButtonEventListener();
}

function getPotentialTitleElements() {
    const titleTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const excludedTags = ['nav', 'footer'];
    let titles = [];

    const SUBSEQUENT_TITLE_THRESHOLD = 2;  // If 3 or more titles follow in close succession, assume the first is a section header.
    
    let stack = [document.body];  // Start with the body element
    
    while (stack.length > 0) {
        const current = stack.pop();

        // If it's an excluded element, don't process its children
        if(excludedTags.includes(current.tagName.toLowerCase()))continue;


        // If it's one of the title tags, assess if it's a potential overarching title
        if (titleTags.includes(current.tagName.toLowerCase())) {
            let nextSibling = current.nextElementSibling;
            let subsequentTitleCount = 0;

            while (nextSibling && subsequentTitleCount < SUBSEQUENT_TITLE_THRESHOLD) {
                subsequentTitleCount++;
                nextSibling = nextSibling.nextElementSibling;
            }

            if (subsequentTitleCount < SUBSEQUENT_TITLE_THRESHOLD) {
                titles.push(current);
            }
        }
        
        // Add children to the stack to process them
        stack.push(...Array.from(current.children));
    
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
                if(!contentUtterance){
                    togglePlayStop(btn, 'play');
                    btn.isSpeaking = false;
                    return;
                }
                contentUtterance.onend = function() {
                    togglePlayStop(btn, 'play');
                    btn.isSpeaking = false;
                };
            };
        });
    });
}
// speak
function speakTitle(button) {
    const title = decodeHtmlEntities(button.previousSibling.textContent);
    console.log(title);
    const utterance = new SpeechSynthesisUtterance(title);
    speechSynthesis.speak(utterance);
    return utterance;
}

function speakContent(button) {
    const contentElement = button.nextElementSibling;

    if(!contentElement) return null;

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
    console.log(utterance, contentTexts);
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
/**
 *  Removes
 */
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



function injectStyles(styles) {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}


const PLAYER_STYLES = `
    .player-button {
        margin-left:  98px;
        padding: 4px;
        margin-top: 30px;
        z-index: 10;
        border: none;
        cursor: pointer;
        position: relative;
        width: 32px;
        height: 32px;
        border-radius: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 2px 3px 3px black;
    }

    .play-icon, .stop-icon {
        width: 24px;
        height: 24px;
    }

    .play-icon {
        content: "";
        display: block;
        width: 24px;
        height: 24px;
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M9 16.985v-10.021l9 5.157-9 4.864zm4-14.98c5.046.504 9 4.782 9 9.97 0 1.467-.324 2.856-.892 4.113l1.738 1.006c.732-1.555 1.154-3.285 1.154-5.119 0-6.303-4.842-11.464-11-11.975v2.005zm-10.109 14.082c-.568-1.257-.891-2.646-.891-4.112 0-5.188 3.954-9.466 9-9.97v-2.005c-6.158.511-11 5.672-11 11.975 0 1.833.421 3.563 1.153 5.118l1.738-1.006zm17.213 1.734c-1.817 2.523-4.769 4.175-8.104 4.175s-6.288-1.651-8.105-4.176l-1.746 1.011c2.167 3.122 5.768 5.169 9.851 5.169 4.082 0 7.683-2.047 9.851-5.168l-1.747-1.011z"/></svg>') no-repeat center;
    }

    .stop-icon {
        content: "";
        display: block;
        width: 12px;
        height: 12px;
        background: black;
        display: none; 
    }
`;