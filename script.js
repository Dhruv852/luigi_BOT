// Get API key from server
let API_KEY;

// Initialize conversation history
let conversationHistory = [];

// Fetch API key from server
fetch('/api/config')
    .then(response => response.json())
    .then(data => {
        API_KEY = data.apiKey;
    })
    .catch(error => {
        console.error('Error fetching API key:', error);
    });
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const audioButton = document.getElementById('stop-audio-button');
const audio = new Audio('Mario-theme-song.mp3');

// Initialize audio button text and state
audioButton.textContent = 'Play Audio';
let isAudioLoaded = false;

// Audio toggle functionality
audio.addEventListener('canplaythrough', () => {
    isAudioLoaded = true;
});

audioButton.addEventListener('click', () => {
    if (!isAudioLoaded) return;
    
    if (audio.paused) {
        audio.play().catch(error => {
            console.error('Error playing audio:', error);
        });
        audioButton.textContent = 'Pause Audio';
    } else {
        audio.pause();
        audioButton.textContent = 'Play Audio';
    }
});

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Handle sending messages
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Create message object
    const userMessage = {
        role: "user",
        parts: [{ text: message }]
    };

    // Add user message to chat with Mario enthusiasm
    const marioEnthusiasm = ['Yahoo! ', 'Here we go! ', 'Okey dokey! ', 'Letss-a o! '];
    const randomEnthusiasm = marioEnthusiasm[Math.floor(Math.random() * marioEnthusiasm.length)];
    addMessage(message, 'user');
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Add user message to conversation history
    conversationHistory.push(userMessage);

    // Show loading message
    const loadingMessage = addMessage('Thinking...', 'bot');

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: conversationHistory,
                safetySettings: [{
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_NONE"
                }],
                generationConfig: {
                    temperature: 0.9,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                    candidateCount: 1
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            // Remove loading message
            loadingMessage.remove();
            // Add bot response with Mario style
            const marioResponses = ['Mama mia! ', 'It\'s-a me, Luigi! ', 'Wahoo! ', 'Here we go! '];
            const randomResponse = marioResponses[Math.floor(Math.random() * marioResponses.length)];
            const botResponse = data.candidates[0].content.parts[0].text;
            const marioStyledResponse = randomResponse + botResponse;
            addMessage(marioStyledResponse, 'bot');

            // Add bot response to conversation history
            conversationHistory.push({
                role: "model",
                parts: [{ text: botResponse }]
            });

            // Limit conversation history to last 10 messages to prevent token limit issues
            if (conversationHistory.length > 10) {
                conversationHistory = conversationHistory.slice(-10);
            }
        } else {
            throw new Error('Invalid response format from API');
        }
    } catch (error) {
        console.error('Error:', error);
        loadingMessage.remove();
        addMessage(`Sorry, I encountered an error: ${error.message}. Please try again.`, 'bot');
    }
}

// Function to parse markdown-like syntax
function parseMarkdown(text) {
    // Replace headings (# Heading)
    text = text.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    text = text.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    text = text.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');

    // Replace numbered lists
    text = text.replace(/^(\d+)\. (.+)$/gm, '<div class="list-item"><span class="number">$1.</span> $2</div>');

    // Replace bullet points
    text = text.replace(/^\*\s+(.+)$/gm, '<div class="list-item bullet">$1</div>');

    // Replace **text** with <strong>text</strong> for bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Replace *text* with <em>text</em> for italics
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Replace single backtick code with <code> for inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Add paragraph breaks
    text = text.replace(/\n\n/g, '<br><br>');

    return text;
}

// Add message to chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.style.display = 'block'; // Ensure message is visible
    messageDiv.style.opacity = '1'; // Set full opacity
    
    // Parse code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);
    parts.forEach(part => {
        if (part.startsWith('```') && part.endsWith('```')) {
            const codeContent = part.slice(3, -3);
            const firstLineEnd = codeContent.indexOf('\n');
            let language = '';
            let code = codeContent;

            // Extract language if specified
            if (firstLineEnd !== -1) {
                language = codeContent.slice(0, firstLineEnd).trim();
                code = codeContent.slice(firstLineEnd + 1);
            }

            const codeElement = document.createElement('code');
            if (language) {
                codeElement.classList.add(`language-${language}`);
            }
            
            // Handle nested code blocks
            const nestedParts = code.split(/(```[\s\S]*?```)/g);
            nestedParts.forEach(nestedPart => {
                if (nestedPart.startsWith('```') && nestedPart.endsWith('```')) {
                    const nestedCode = nestedPart.slice(3, -3);
                    const nestedCodeElement = document.createElement('code');
                    nestedCodeElement.textContent = nestedCode;
                    nestedCodeElement.classList.add('nested-code');
                    codeElement.appendChild(nestedCodeElement);
                } else {
                    codeElement.appendChild(document.createTextNode(nestedPart));
                }
            });
            
            messageDiv.appendChild(codeElement);
        } else if (part.trim()) {
            // Parse markdown in non-code parts
            const parsedText = parseMarkdown(part);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = parsedText;
            while (tempDiv.firstChild) {
                messageDiv.appendChild(tempDiv.firstChild);
            }
        }
    });
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageDiv;
}

// Event listeners

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (!e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }
});