/********************************************** Initialization ***************************************************/

setTimeout(renderPlayer, 500);

window.addEventListener('beforeunload', function() {
    speechSynthesis.cancel();
});

/*****************************************************************************************************************/



/******************************************* Constants & Configurations *******************************************/

const MAX_HEIGHT_BELOW_TITLE  = 3;
const PLAYER_BUTTON_ATTRIBUTE  = 'player-button';
const MARKED_CONTENT_ATTRIBUTE  = 'marked-content';

const SEMANTIC_TAGS = {
    title: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    // article: ['article', 'section']
};
const SEMANTIC_KEYWORDS = {
    title: ['headline', 'title'],
    // article: ['content', 'post']
};

const EXCLUDED_TAGS = ['script', 'link', 'meta', 'style', 'noscript', 'br', 
'hr', 'source', 'param', 'track', 'input', 'nav', 'footer', 'button', 'header', 'time', 'form'];

const EXCLUDED_KEYWORDS = ['mobile', 'name', 'date', 'print', 'time', 'tinytime', 'author'];

/*****************************************************************************************************************/



/**************************************************** Main Logic *************************************************/

function renderPlayer() {
    
    const potentialTitles = identifyPotentialTitles();

    markContentForButtons(potentialTitles);

    renderPlayerButtons();

}


/**
 * Returns validated titles based on their semantic HTML attributes.
 * The function traverses the entire document, identifies potential titles or summaries, and
 * validates them against a set of criteria like HTML tag type, class names, and adjacent content height.
 * 
 * @returns {Array} An array of HTML elements that are considered valid titles or summaries.
 */
function identifyPotentialTitles() {

    let titles = [];
    
    let stack = [document.body];

    while(stack.length){
        const current = stack.pop();

        if(hasExclusionCriteria(current))continue;

        if(isPotentialTitle(current))titles.push(current);
            
        stack.push(...Array.from(current.children));
    }
    
    return titles;
}
/**
 * Checks if a given HTML element is relevant content (like a title or summary) based on its tag, class, and adjacent element height.
 * 
 * @param {HTMLElement} element - The HTML element to validate.
 * @returns {boolean} True if the element is considered a relevant content, otherwise false.
 */
function isPotentialTitle(element) {

    const nextElement = element.nextElementSibling;

    if(!matchesSemanticCriteria(element))return false;

    // Check if the title might be a category title based on the size or absence of the next element
    if (!nextElement || getElementHeight(nextElement) <= MAX_HEIGHT_BELOW_TITLE) {
        return true;
    }

    return false;
}


/**
 * Marks content sections for association with player buttons for speech synthesis.
 * 
 * @param {Array} elements - The list of elements to process.
 */
function markContentForButtons(elements) {

    let buttonId = 0;

    elements.forEach(element => {
        if (!element.hasAttribute(MARKED_CONTENT_ATTRIBUTE)) {
            buttonId++;

            element.setAttribute(PLAYER_BUTTON_ATTRIBUTE , buttonId);
            if(isValidContent(element)){
                element.setAttribute(MARKED_CONTENT_ATTRIBUTE , buttonId);
            }
            ensureUniqueContentForSpeaking(element, buttonId);
        }
    });
}
/**
 * Ensures that the given element, its siblings, and descendants 
 * are unique to prevent them from being duplicated for speech synthesis.
 * 
 * @param {Element} element - The element to start from.
 * @param {Number} buttonId - The identifier of the associated player button.
 */
function ensureUniqueContentForSpeaking(element, buttonId){
    let sibling = element;

    // Iterate through the next siblings of the element
    while (sibling) {
        if (!sibling.hasAttribute(MARKED_CONTENT_ATTRIBUTE )) {
            if(isValidContent(element)){

                sibling.setAttribute(MARKED_CONTENT_ATTRIBUTE , buttonId);
            }
                
            sibling.childNodes.forEach(child => {
                if (child.nodeType === Node.ELEMENT_NODE) {

                    ensureUniqueContentForSpeaking(child, buttonId);
                }
            });
        }

        sibling = sibling.nextElementSibling;
    }
}


/**
 * Creates and appends play buttons next to the specified elements.
 *
 * @param {HTMLElement[]} elements - The list of elements beside which the player buttons are to be added.
 */
function renderPlayerButtons() {
    injectStyles(PLAYER_STYLES);
    
    const elements = document.querySelectorAll(`[${PLAYER_BUTTON_ATTRIBUTE }]`); // This gets all elements with the PLAYER_BUTTON_ATTRIBUTE  attribute
    
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

    addPlayButtonEventListener();
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


/**
 * Initiates speech synthesis for the title associated with the given button.
 * 
 * This function retrieves the title text from the button's previous element 
 * (assuming the button is placed right after the title) and initiates speech synthesis
 * to speak the title. If no title is found, it returns null.
 * 
 * @param {HTMLElement} button - The player button clicked by the user.
 * @return {SpeechSynthesisUtterance|null} The speech utterance object or null if no title found.
 */
function speakTitle(button) {
    let titleElement = button.previousElementSibling;

    if(!titleElement) return null;

    const title = decodeHtmlEntities(titleElement.textContent);
    console.log("speak title:" ,title);
    const utterance = new SpeechSynthesisUtterance(title);
    speechSynthesis.speak(utterance);
    return utterance;
}
/**
 * Initiates speech synthesis for the content associated with the given button.
 * 
 * This function retrieves the content text from the button's next element, ensuring
 * the content doesn't match any exclusion criteria. If eligible content is found,
 * it initiates speech synthesis to speak the content. If no content is found or it
 * matches the exclusion criteria, it returns null.
 * 
 * @param {HTMLElement} button - The player button clicked by the user.
 * @return {SpeechSynthesisUtterance|null} The speech utterance object or null if no content found.
 */
function speakContent(button) {
    let contentElement = button.nextElementSibling;

    // Loop to find the next eligible content element
    while(contentElement && hasExclusionCriteria(contentElement)) {
        console.log("No content next to title!");
        contentElement = contentElement.nextElementSibling;
    }

    if(!contentElement) return null;

    const contentTexts = getTextNodesIn(contentElement)
                              .map(node => {
                                  
                                  //console.log("Before decoding:", node.nodeValue);

                                  const decoded = decodeHtmlEntities(node.nodeValue);

                                  //console.log("After decoding:", decoded);

                                  return decoded;
                              })
                              .join(' ');
                               
    const utterance = new SpeechSynthesisUtterance(contentTexts);
    console.log("speak content:", contentTexts);
    speechSynthesis.speak(utterance);
    return utterance;
}

/***********************************************************************************************************/




/********************************************** Utilities **************************************************/

/**
 * Retrieves all text nodes within an element while respecting the exclusion criteria.
 *
 * @param {HTMLElement} elem - The parent element.
 * @returns {Array} Array of text nodes.
 */
function getTextNodesIn(elem) {
    let textNodes = [];
    
    for (let node of elem.childNodes) {
        if (node.nodeType === 3) { // text node
            textNodes.push(node);
        } else if (node.nodeType === 1 && !hasExclusionCriteria(node)) { // element node and not excluded
            textNodes = textNodes.concat(getTextNodesIn(node));
        }
    }
    
    return textNodes;
}


/**
 * Determines if an element matches semantic criteria for a specified type (e.g., title).
 * It checks the element's tag and class attributes against a predefined list of semantic tags and keywords.
 * 
 * @param {HTMLElement} element - The element to check.
 * @param {string} type - The semantic type (e.g., 'title'). Default is 'title'.
 * @returns {boolean} True if the element matches the semantic criteria, otherwise false.
 */
function matchesSemanticCriteria(element, type = 'title') {
    const hasValidTag = SEMANTIC_TAGS[type].includes(element.tagName.toLowerCase());

    const hasValidIndicatorKeyword = Array.from(element.classList).some(className => {
        const parts = className.split('-');
        return parts.some(part => SEMANTIC_KEYWORDS[type].includes(part.toLowerCase()));
    });

    return hasValidTag || hasValidIndicatorKeyword;
}


/**
 * Determines if an element matches any exclusion criteria.
 * It checks the element's tag and class attributes against a predefined list of excluded tags and keywords.
 * 
 * @param {HTMLElement} element - The element to check.
 * @returns {boolean} True if the element matches the exclusion criteria, otherwise false.
 */
function hasExclusionCriteria(element) {
    const hasExcludedTag = EXCLUDED_TAGS.includes(element.tagName.toLowerCase());

    const hasExcludedKeyword = Array.from(element.classList).some(className => {
        if (EXCLUDED_KEYWORDS.includes(className.toLowerCase())) {
            return true; // Case where the class is a standalone excluded word
        }

        const parts = className.split('-');
        return parts.some(part => EXCLUDED_KEYWORDS.includes(part.toLowerCase()));
    });

    return hasExcludedTag || hasExcludedKeyword;
}


/**
 * Calculates the height of the given element in the DOM tree.
 * The height of an element is defined as:
 * - 0 if the element has no children.
 * - 1 plus the maximum height of its children if the element has children.
 *
 * @param {HTMLElement} element - The element for which the height is to be calculated.
 * @returns {number} - The height of the element.
 */
function getElementHeight(element) {
    // Base condition: If the element has no children, its height is 0
    if (!element.children.length) {
        return 0;
    }
    // Has at least 1 child
    const currentHeight = 1;

    let maxChildHeight = 0;
    for (const child of element.children) {
        maxChildHeight = Math.max(maxChildHeight, getElementHeight(child));
    }

    return currentHeight + maxChildHeight;
}


/**
 * Checks if an element's content is valid for reading.
 * Elements with all-uppercase content are considered not valid.
 * 
 * @param {Element} element - The element to check.
 * @returns {Boolean} - Whether the element is valid for reading.
 */
function isValidContent(element) {
    const content = element.textContent.trim();

    // Check for all-uppercase words
    const uppercasePattern = /\b[A-Z]+\b/;
    return !uppercasePattern.test(content);
}

/**
 * Stops all currently speaking audio buttons except for a specified one.
 * 
 * This function iterates through all the audio player buttons on the page and
 * stops their speech synthesis if they are currently speaking. The function 
 * provides an option to exclude a specific button from being stopped.
 * 
 * @param {HTMLElement} excludedBtn - The audio button that should not be stopped.
 */
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
/**
 * Decodes HTML entities and cleans up a provided HTML string.
 * 
 * This function:
 * 1. Converts HTML `<br>` tags to newline characters.
 * 2. Decodes the HTML entities to their corresponding characters.
 * 3. Strips out all other HTML tags.   
 * 4. Consolidates multiple spaces or tabs into a single space.
 * 
 * @param {string} text - The input HTML string to be decoded and cleaned.
 * @returns {string} The cleaned string without HTML tags and with HTML entities decoded.
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
/**
 * Toggles the visual state of the audio player button between play and stop.
 * 
 * This function modifies the appearance of a specified audio player button
 * to either a play or stop state, based on the provided state parameter.
 * It also sets the `isSpeaking` attribute of the button to reflect the current state.
 * If transitioning to the 'play' state, any ongoing speech synthesis is cancelled.
 * 
 * @param {HTMLElement} button - The audio player button to be toggled.
 * @param {string} state - The desired state of the button: 'play' or 'stop'.
 */
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

/*****************************************************************************************************************/



/********************************************** Styles ***********************************************************/
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
/*****************************************************************************************************************/