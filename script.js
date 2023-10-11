document.addEventListener("DOMContentLoaded", function() {
    renderPlayer();
});

window.addEventListener('beforeunload', function() {
    speechSynthesis.cancel();
});



const MAX_HEIGHT_FOR_TITLE = 3;

const TAG_HEIGHT = 'tag-height';

const PLAYER_BUTTON = 'player-button';

const MARKED_CONTENT = 'marked-content';

const TITLE_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

const TITLE_INDICATOR_KEYWORDS = ['headline', 'title'];

const EXCLUDED_TAGS = ['script', 'link', 'meta', 'style', 'noscript', 'br', 
'hr', 'source', 'param', 'track', 'input', 'nav', 'footer', 'button', 'header', 'time', 'form'];

const EXCLUDED_WORDS = ['mobile', 'name', 'date', 'print', 'time'];


function renderPlayer() {
    injectStyles(PLAYER_STYLES);
    preprocessHtml();
    const titlesOrSummaries = getValidatedTitlesOrSummaries();
    markRelevantContent(titlesOrSummaries);
    renderPlayerButtons();
    addPlayButtonEventListener();
}


function isValidContent(element) {
    const content = element.textContent.trim();

    /*const hasExcludedWords = Array.from(element.classList).some(className => {
        const parts = [className, ...className.split('-')];
        return parts.some(part => EXCLUDED_WORDS.includes(part.toLowerCase()));
    });


    const hasExcludedWords = Array.from(element.classList).some(className => {
        return EXCLUDED_WORDS.some(excludedWord => className.toLowerCase().includes(excludedWord));
    });


    if(hasExcludedWords)return false;*/

    // Check for all-uppercase words
    const uppercasePattern = /\b[A-Z]+\b/;
    if (uppercasePattern.test(content)) return false;

    return true;
}


function markRelevantContent(elements) {

    let buttonId = 0;
    elements.forEach(element => {
        // Check if the element hasn't been marked yet
        if (!element.hasAttribute(MARKED_CONTENT)) {

            buttonId++;
            element.setAttribute(PLAYER_BUTTON, buttonId);
            if(isValidContent(element))
                element.setAttribute(MARKED_CONTENT, buttonId);
            markSiblings(element, buttonId);
        }
    });
}

function markSiblings(element, buttonId) {
    let sibling = element;

    // Iterate through the next siblings of the element
    while (sibling) {
        if (!sibling.hasAttribute(MARKED_CONTENT)) {
            if(isValidContent(element))
                sibling.setAttribute(MARKED_CONTENT, buttonId);

            // Check children of the sibling
            sibling.childNodes.forEach(child => {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    markSiblings(child, buttonId);
                }
            });
        }

        sibling = sibling.nextElementSibling;
    }
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

    const currentHeight = 1;

    let maxChildHeight = 0;
    for (const child of element.children) {
        maxChildHeight = Math.max(maxChildHeight, calculateTagHeight(child));
        element.setAttribute(TAG_HEIGHT, maxChildHeight);
    }

    return currentHeight + maxChildHeight;
}


/**
 * Returns validated titles or summaries based on their HTML structure and styling.
 * It searches through the entire document, identifies potential titles, and
 * checks them against a set of criteria (like HTML tag type, class names, and adjacent content height).
 * 
 * @returns {Array} An array of HTML elements that are considered valid titles or summaries.
 */
function getValidatedTitlesOrSummaries() {

    let titlesOrSummaries = [];
    
    let stack = [document.body];

    while(stack.length){
        const current = stack.pop();

        if(hasExcludedElements(current))continue;

        if(isRelativeContent(current))titlesOrSummaries.push(current);
            
        stack.push(...Array.from(current.children));
    }
    
    return titlesOrSummaries;
}
/**
 * Checks if a given HTML element is relevant content (like a title or summary) based on its tag, class, and adjacent element height.
 * 
 * @param {HTMLElement} element - The HTML element to validate.
 * @returns {boolean} True if the element is considered a relevant content, otherwise false.
 */
function isRelativeContent(element) {

    const nextElement = element.nextElementSibling;

    const hasValidTag = TITLE_TAGS.includes(element.tagName.toLowerCase());

    const hasValidIndicatorKeyword = Array.from(element.classList).some(className => {
        const parts = className.split('-');
        return parts.some(part => TITLE_INDICATOR_KEYWORDS.includes(part.toLowerCase()));
    });

    if(hasValidTag || hasValidIndicatorKeyword){
        if(!nextElement || (nextElement && nextElement.getAttribute(TAG_HEIGHT) <= MAX_HEIGHT_FOR_TITLE))
            return true;
    }

    return false;
}



/**
 * Creates and appends play buttons next to the specified elements.
 *
 * @param {HTMLElement[]} elements - The list of elements beside which the player buttons are to be added.
 */
function renderPlayerButtons() {
    const elements = document.querySelectorAll(`[${PLAYER_BUTTON}]`); // This gets all elements with the PLAYER_BUTTON attribute
    console.log(elements);
    elements.forEach(element => {
        const btn = document.createElement("button");
        btn.classList.add("player-button");

        const playIcon = document.createElement("span");
        playIcon.classList.add("play-icon");

        const stopIcon = document.createElement("span");
        stopIcon.classList.add("stop-icon");
        stopIcon.style.display = "none"; // Initially hidden

        btn.appendChild(playIcon);
        btn.appendChild(stopIcon);

        element.parentNode.insertBefore(btn, element.nextSibling);
    });
}



/**
 * Adds event listeners to the player buttons.
 * 
 * For each player button, an event listener is added to handle the play and stop functionality.
 * The function handles the speech synthesis, switching between the play and stop icons, 
 * and manages the state of the button (whether it's currently speaking or not).
 */
function addPlayButtonEventListener() {
    const buttons = document.querySelectorAll(".player-button");
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();  
            e.stopPropagation(); 

            stopAllSpeakingButtons(btn);

            if (btn.isSpeaking) {
                speechSynthesis.cancel();
                togglePlayStop(btn, 'play');
                return;
            }

            togglePlayStop(btn, 'stop');
            // Speak the title
            const titleUtterance = speakTitle(btn);

            // When the title speaking ends, speak the content
            titleUtterance.onend = function() {
                const contentUtterance = speakContent(btn);
                if(!contentUtterance) {
                    togglePlayStop(btn, 'play');
                    return;
                }
                contentUtterance.onend = function() {
                    togglePlayStop(btn, 'play');
                };
            };
        });
    });
}




function speakTitle(button) {
    let titleElement = button.previousElementSibling;

    //if(hasExcludedElements(titleElement)){
     //   titleElement = Array.from(titleElement.children).find(child => !hasExcludedElements(child));
    //}
    
    if(!titleElement) return null;

    const title = decodeHtmlEntities(titleElement.textContent);
    console.log("speak title:" ,title);
    const utterance = new SpeechSynthesisUtterance(title);
    speechSynthesis.speak(utterance);
    return utterance;
}

function speakContent(button) {
    let contentElement = button.nextElementSibling;

    // Loop to find the next eligible content element
    while(contentElement && hasExcludedElements(contentElement)) {

        contentElement = contentElement.nextElementSibling;
    }

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

function hasExcludedElements(elem) {

    const hasExcludedClassName = Array.from(elem.classList).some(className => 
        EXCLUDED_WORDS.some(excludedWord => className.toLowerCase().includes(excludedWord))
    );

    const hasExcludedTag = EXCLUDED_TAGS.includes(elem.tagName.toLowerCase());

    return hasExcludedClassName || hasExcludedTag;
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



function stopAllSpeakingButtons(excludedBtn) {
    const buttons = document.querySelectorAll(".player-button");
    buttons.forEach(button => {

        if (button !== excludedBtn && button.isSpeaking) {
            speechSynthesis.cancel();
            togglePlayStop(button, 'play');
            button.isSpeaking = false;
        }
    });
}



function togglePlayStop(button, state){
    speechSynthesis.cancel();
    const playIcon = button.querySelector('.play-icon');
    const stopIcon = button.querySelector('.stop-icon');

    if (state === 'play') {
        button.isSpeaking = false;
        playIcon.style.display = 'block';
        stopIcon.style.display = 'none';
    } else if (state === 'stop') {
        button.isSpeaking = true;
        playIcon.style.display = 'none';
        stopIcon.style.display = 'block';
    }
}



function injectStyles(styles) {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

const PLAYER_STYLES = `
    .player-button {
        margin-right: auto;
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
        transform: scale(2) rotate(10deg);
        transform-origin: center;
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