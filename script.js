const CHAR_NUM = 'data-char-num';
const TAG_NUM = 'data-tag-num';  
const TEXT_DENSITY = 'data-text-density';
const PLAYER_ID = 'player-controler';

// No need to search in these tags
const EXCLUDED_TAGS = ['script', 'link', 'meta', 'style', 'noscript', 'br', 
'hr', 'source', 'param', 'track', 'input', 'nav', 'footer'];
const LINK_TAGS = ['a', 'button', 'select'];

document.addEventListener("DOMContentLoaded", function() {
    renderPlayer();
});


function renderPlayer() {
    injectStyles(PLAYER_STYLES);
    getRelevantContent();
    //addPlayButtonEventListener();
}


function getRelevantContent(){

    calculateTextDensity(document.body);
    markPlayerControllers();
}

/**
 * Highlights elements with a text density greater than body's text density + 10
 */
function highlightElementsWithHighDensity() {
    const bodyDensity = parseFloat(document.body.getAttribute(TEXT_DENSITY)) || 0;
    traverseAndHighlight(document.body, bodyDensity);
}

function traverseAndHighlight(element, bodyDensity) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return;

    const rawValue = element.getAttribute(TEXT_DENSITY);
    console.log("Raw Value:", rawValue);
    const elementDensity = parseFloat(rawValue) || 0;

    if (elementDensity > bodyDensity + 5) {
        console.log("Highlighting: ", element.tagName, "with density:", elementDensity, "Body density:", bodyDensity);
        element.style.border = '5px solid red'; // Thick red border
    } else {
        console.log("Skipping: ", element.tagName, "with density:", elementDensity, "Body density:", bodyDensity);
    }

    // recursively process child elements
    for(let child of element.children) {
        traverseAndHighlight(child, bodyDensity);
    }
}



/**
 * Computes the text density for a given element and its descendants.
 * Text density is calculated as the ratio of CHAR_NUM to TAG_NUM.
 * If either attribute is missing or is zero, it's defaulted to 1.
 * The calculated text density is then set as an attribute named "text_density" on each element.
 * 
 * @param {HTMLElement} element - The root element from which the text density calculation starts.
 */
function calculateTextDensity(element) {

    if (!element || element.nodeType !== Node.ELEMENT_NODE) return;

    countChars(element);
    countTags(element);

    let stack = [element];

    while (stack.length) {
        const current = stack.pop();

        if (EXCLUDED_TAGS.includes(current.tagName.toLowerCase())) continue;

        let charNum = parseInt(current.getAttribute(CHAR_NUM), 10) || 1;
        let tagNum = parseInt(current.getAttribute(TAG_NUM), 10) || 1;

        let text_density = charNum / tagNum;
        current.setAttribute(TEXT_DENSITY, text_density);

        stack.push(...Array.from(current.children));
    }
}




/**
 * Counts the characters of an element and its descendants,
 * then sets the count as an attribute on each element. 
 * The count excludes any text content from child elements, focusing 
 * only on the direct text content of each individual element.
 * 
 * @param {HTMLElement} element - The element to count characters for.
 */
function countChars(element) {

    if (!element || element.nodeType !== Node.ELEMENT_NODE) return 0;

    if (EXCLUDED_TAGS.includes(element.tagName.toLowerCase())) return 0;

    let textContent = "";

    for(let child of element.childNodes) {
        if(child.nodeType === Node.TEXT_NODE) {
            textContent += child.nodeValue;
        }
    }

    let childrenCharNum = 0;
    for(let child of element.children) {
        childrenCharNum += countChars(child);
    }
    
    const elementCharNum = childrenCharNum + decodeHtmlEntities(textContent).trim().length;
    //* Debug
   // console.log(element, elementCharNum);

    element.setAttribute(CHAR_NUM, elementCharNum);

    return elementCharNum;
}



/**
 * Counts the number of tags (elements) within a given element's subtree.
 * 
 * @param {HTMLElement} element - The root element of the subtree.
 * @returns {number} - The total number of tags within the subtree.
 */
function countTags(element) {
    if (!element)return 0;

    // Initialize with 1 for the current element
    let tagCount = 1;

    // Recursively count tags in all child elements and add to the total
    for (let child of element.children) {
        tagCount += countTags(child);
    }

    element.setAttribute(TAG_NUM, tagCount);

    return tagCount;
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


function markPlayerControllers() {
    const bodyDensity = parseFloat(document.body.getAttribute(TEXT_DENSITY)) || 0;
    let controllerID = 0;

    traverseAndMark(document.body, bodyDensity, controllerID);
}

function traverseAndMark(element, bodyDensity, controllerID) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return controllerID; // Return the current controllerID

    const rawValue = element.getAttribute(TEXT_DENSITY);
    const elementDensity = parseFloat(rawValue) || 0;

    // If element's density is greater than body's, assign a player-controller and an ID
    if (elementDensity > bodyDensity + 14 && !element.getAttribute(PLAYER_ID)) {
        element.setAttribute(PLAYER_ID, controllerID); // mark the element with 'player-controler'


        
        markNextNodes(element, controllerID);

        let btn = document.createElement("button");
        btn.value = controllerID;
        btn.innerText = `Player ${controllerID}`;
        
        // Add the styles
        btn.style.backgroundColor = 'blue'; // background color
        btn.style.color = 'white';          // text color
        btn.style.border = 'none';          // removes any default border
        btn.style.padding = '10px';         // adds some padding to the button
        btn.style.borderRadius = '5px';     // rounded corners
        
        element.appendChild(btn);
        

        console.log(controllerID);

        // Append a button to the current element
        //renderPlayerButton(element);
                // Append a button to the current element

        controllerID++; // increment the ID for the next eligible element
    }

    // recursively process child elements
    for(let child of element.children) {
        controllerID = traverseAndMark(child, bodyDensity, controllerID);
    }

    return controllerID; // Return the current controllerID, so it can be used in further traversals
}

function markNextNodes(elem, controllerID) {
    if (!elem) return;

    // Mark the siblings with the same controllerID
    /*let sibling = elem.nextSibling;
    while (sibling) {
        if (sibling.nodeType === 1) { // element node
            sibling.setAttribute(PLAYER_ID, controllerID);
        }
        sibling = sibling.nextSibling;
    }*/

    // Recursively mark the child nodes
    for (let node of elem.childNodes) {
        if (node.nodeType === 3) { // text node
            elem.setAttribute(PLAYER_ID, controllerID);
        } else {
            markNextNodes(node, controllerID);
        }
    }
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


function renderPlayerButton(element) {

        const btn = document.createElement("button");
        btn.classList.add("player-button");

        const playIcon = document.createElement("span");
        playIcon.classList.add("play-icon");
        
        const stopIcon = document.createElement("span");
        stopIcon.classList.add("stop-icon");
        stopIcon.style.display = "none"; // Initially hidden

        btn.appendChild(playIcon);
        btn.appendChild(stopIcon);
        
        element.parentNode.insertBefore(btn, element);

        console.log(element);

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