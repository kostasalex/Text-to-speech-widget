document.addEventListener("DOMContentLoaded", function() {
    renderPlayer();
});

window.addEventListener('beforeunload', function() {
    speechSynthesis.cancel();
});


function stopAllSpeakingButtons() {
    const buttons = document.querySelectorAll(".player-button");
    buttons.forEach(button => {
        if (button.isSpeaking) {
            speechSynthesis.cancel();
            togglePlayStop(button, 'play');
            button.isSpeaking = false;
        }
    });
}

// Attributes
const TAG_HEIGHT = 'tag-height';


const MAX_HEIGHT = 3; 

const TITLE_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const TITLE_CLASS_WORDS = ['headline', 'title'];
const EXCLUDED_TAGS = ['script', 'link', 'meta', 'style', 'noscript', 'br', 
'hr', 'source', 'param', 'track', 'input', 'nav', 'footer', 'button', 'header', 'time', 'form'];
const EXCLUDED_WORDS = ['message', 'form', 'error', 'footer', 'header', 'nav', 'time', 'date', 'sign'];


function renderPlayer() {
    injectStyles(PLAYER_STYLES);
    preprocessHtml();
    const titles = getPotentialTitleElements();
    renderPlayerButtons(titles);
    addPlayButtonEventListener();
}


function preprocessHtml(){
    calculateTagHeight(document.body);
}

function calculateTagHeight(element) {
    // Base condition: If the element has no children, its height is 0
    if (!element.children.length) {
        element.setAttribute(TAG_HEIGHT, 0);
        return 0;
    }

    // Get the maximum height among all children
    let maxChildHeight = 0;
    for (const child of element.children) {
        maxChildHeight = Math.max(maxChildHeight, calculateTagHeight(child));
        element.setAttribute(TAG_HEIGHT, maxChildHeight);
    }

    // Height of current element is 1 + maximum height of its children
    return 1 + maxChildHeight;
}



function isRelativeContent(element) {
    const nextElement = element.nextElementSibling;

    const hasValidTag = TITLE_TAGS.includes(element.tagName.toLowerCase());

    const hasValidClassWords = Array.from(element.classList).some(className => {
        // Split the class name by '-' and check each part against TITLE_CLASS_WORDS
        const parts = className.split('-');
        return parts.some(part => TITLE_CLASS_WORDS.includes(part.toLowerCase()));
    });

    if ((hasValidTag || hasValidClassWords) && (!nextElement || (nextElement && nextElement.getAttribute(TAG_HEIGHT) <= MAX_HEIGHT))) {
        return true;
    }

    return false;
}




function getPotentialTitleElements() {

    let titles = [];
    
    let stack = [document.body];
    
    while (stack.length > 0) {
        const current = stack.pop();

        // If it's an excluded element, don't process its children
        if(EXCLUDED_TAGS.includes(current.tagName.toLowerCase()))continue;


        // If it's one of the title tags, assess if it's a potential overarching title
        if(isRelativeContent(current)){
            titles.push(current);
        }
        
        // Add children to the stack to process them
        stack.push(...Array.from(current.children));
    
    }
    
    return titles;
}

function annotateDepth() {
    let stack = [{ element: document.body, depth: 0 }];
    
    while (stack.length > 0) {
        const currentData = stack.pop();
        const current = currentData.element;
        const currentDepth = currentData.depth;
        
        const comment = document.createComment(`Depth: ${currentDepth}`);
        current.parentNode.insertBefore(comment, current);
        
        const childrenWithDepth = Array.from(current.children).map(child => ({ element: child, depth: currentDepth + 1 }));
        stack.push(...childrenWithDepth);
    }
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

        // Adding the event listener to the button
        btn.addEventListener("click", function(e) {
            stopAllSpeakingButtons();
            e.preventDefault();  // Prevents the default action (navigating to the link)
            e.stopPropagation(); // Stops the event from bubbling up to the <a> element

            // Your button's code here
            // For example, toggling between play and stop icons
            if (playIcon.style.display !== "none") {
                playIcon.style.display = "none";
                stopIcon.style.display = "block";
            } else {
                playIcon.style.display = "block";
                stopIcon.style.display = "none";
            }
        });

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
        margin: auto;
        padding: 4px;
        margin-top: 30px;
        z-index: 30;
        border: none;
        background: #1E90FF;
        cursor: pointer;
        position: relative;
        width: 35px;
        height: 35px;
        border-radius: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 2px 3px 3px black;

    }

    .player-button:hover {
        background: white;
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