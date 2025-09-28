import { getContext, updateKnowledgeGraph } from './contextService';

console.log('ChatGPT injection content script loaded');

// Function to find the ChatGPT input element
function findChatInput(): HTMLElement | null {
    // Try multiple selectors for the ChatGPT input
    const selectors: string[] = [
        '#prompt-textarea',
        '.ProseMirror[contenteditable="true"]',
        'div[contenteditable="true"][data-placeholder*="Ask"]',
        'textarea[placeholder*="Ask"]',
        'div[contenteditable="true"]'
    ];
    
    for (const selector of selectors) {
        const element = document.querySelector(selector) as HTMLElement;
        if (element && element.offsetHeight > 0) { // Make sure element is visible
            console.log('Found chat input element:', element);
            return element;
        }
    }
    return null;
}

// Function to find the submit button
function findSubmitButton(): HTMLButtonElement | null {
    const selectors: string[] = [
        'button[data-testid="send-button"]',
        'button[aria-label*="Send"]',
        'form button[type="submit"]',
        'button:has(svg)'
    ];
    
    for (const selector of selectors) {
        const button = document.querySelector(selector) as HTMLButtonElement;
        if (button) {
            console.log('Found submit button:', button);
            return button;
        }
    }
    return null;
}

// Function to get text content from ProseMirror editor
function getTextFromProseMirror(element: HTMLElement): string {
    if (element.classList.contains('ProseMirror')) {
        return element.textContent || element.innerText || '';
    } else if (element.tagName === 'TEXTAREA') {
        return (element as HTMLTextAreaElement).value;
    }
    return element.textContent || element.innerText || '';
}

// Function to set text in the input area (works with different types)
function setTextInProseMirror(element: HTMLElement, text: string): void {
    if (element.classList.contains('ProseMirror')) {
        const p = element.querySelector('p') || document.createElement('p');
        p.textContent = text;
        p.classList.remove('placeholder');
        if (!element.contains(p)) {
            element.innerHTML = '';
            element.appendChild(p);
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Set cursor to end
        const range = document.createRange();
        const sel = window.getSelection();
        if (sel) {
            range.selectNodeContents(p);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
        
    } else if (element.tagName === 'TEXTAREA') {
        (element as HTMLTextAreaElement).value = text;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
        element.textContent = text;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

// **MODIFIED FUNCTION**
// This function now handles buffering and async context retrieval
function interceptSubmission(chatInput: HTMLElement): void {
    let isProcessing = false; // Flag to prevent multiple submissions

    console.log('Setting up submission interceptor');

    chatInput.addEventListener('keydown', async function(e: KeyboardEvent) {
        // Intercept 'Enter' key press (without Shift, Ctrl, or Meta)
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !isProcessing) {
            const originalText = getTextFromProseMirror(chatInput).trim();

            if (originalText) {
                // Start knowledge graph update in background (non-blocking)
                updateKnowledgeGraph(originalText);

                // 1. Prevent the original message from being sent
                e.preventDefault();
                e.stopPropagation();

                // 2. Start processing: update UI to show a buffering state
                isProcessing = true;
                const submitButton = findSubmitButton();
                if (submitButton) submitButton.disabled = true;
                chatInput.setAttribute('contenteditable', 'false');
                setTextInProseMirror(chatInput, "loading...");

                // 3. Get context from the async function
                console.log('Getting context for input:', originalText);
                try {
                    const injectedText = await getContext(originalText);
                    console.log('Context retrieval finished.');

                    // 4. Prepare the final message with the context
                    const modifiedText = originalText + injectedText;
                    console.log('Modified text:', modifiedText);

                    // 5. Restore input and set the new text
                    chatInput.setAttribute('contenteditable', 'true');
                    setTextInProseMirror(chatInput, modifiedText);
                    chatInput.focus();

                    // 6. Automatically send the modified message
                    setTimeout(() => {
                        console.log('Attempting to send the modified message...');
                        const btn = findSubmitButton();
                        if (btn) {
                            // Re-enable and click the button
                            btn.disabled = false;
                            btn.click();
                            console.log('Submitted via button click');
                        } else {
                            console.error('Could not find the submit button to send the message.');
                        }

                        // 7. Reset the processing state after submission
                        setTimeout(() => {
                            isProcessing = false;
                            console.log('Processing complete. Ready for new input.');
                        }, 500);

                    }, 100); // Small delay to ensure UI updates before clicking

                } catch (error) {
                    console.error('Error getting context:', error);
                    
                    // Restore input with original text if error occurs
                    chatInput.setAttribute('contenteditable', 'true');
                    setTextInProseMirror(chatInput, originalText);
                    chatInput.focus();
                    
                    if (submitButton) submitButton.disabled = false;
                    isProcessing = false;
                }
            }
        }
    }, true); // Use capture phase to intercept the event early

    (chatInput as any).dataset.injectionSetup = 'true';
}

// Function to setup the injection
function setupInjection(): boolean {
    const chatInput = findChatInput();
    
    if (chatInput && !(chatInput as any).dataset.injectionSetup) {
        console.log('ChatGPT input found, setting up injection');
        interceptSubmission(chatInput);
        return true;
    } else if (chatInput) {
        console.log('ChatGPT input already has injection setup');
        return true;
    } else {
        console.log('ChatGPT input not found, will retry...');
        return false;
    }
}

// Initial setup with retry mechanism
let setupAttempts = 0;
const maxAttempts = 30;

function trySetup(): void {
    if (setupAttempts >= maxAttempts) {
        console.log('Max setup attempts reached, giving up');
        return;
    }
    
    setupAttempts++;
    console.log(`Setup attempt ${setupAttempts}/${maxAttempts}`);
    
    if (!setupInjection()) {
        setTimeout(trySetup, 1000); // Try again in 1 second
    } else {
        console.log('ChatGPT injection setup completed successfully');
        
        // Watch for navigation changes and new elements (important for Single-Page Apps)
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as Element;
                            if (element.matches && (
                                element.matches('#prompt-textarea') ||
                                element.matches('.ProseMirror[contenteditable="true"]') ||
                                element.querySelector('#prompt-textarea') ||
                                element.querySelector('.ProseMirror[contenteditable="true"]')
                            )) {
                                shouldCheck = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldCheck) {
                setTimeout(() => {
                    const input = findChatInput();
                    if (input && !(input as any).dataset.injectionSetup) {
                        console.log('New chat input detected, setting up injection');
                        interceptSubmission(input);
                    }
                }, 500);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Start setup process
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trySetup);
} else {
    setTimeout(trySetup, 100); // Small delay to ensure page is ready
}

window.addEventListener('load', () => {
    setTimeout(trySetup, 500);
});

console.log('ChatGPT injection script initialized');
