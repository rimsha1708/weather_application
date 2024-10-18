let apiKey = 'AIzaSyBIjzPAr1YwAnXmdO482KKURnCYQodedFQ';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Chat toggle functionality
document.getElementById('chat-toggle').addEventListener('click', function() {
    const chatWindow = document.getElementById('chat-window');
    const openText = this.querySelector('.open-chat');
    const closeText = this.querySelector('.close-chat');
    
    chatWindow.classList.toggle('active');
    openText.style.display = openText.style.display === 'none' ? 'block' : 'none';
    closeText.style.display = closeText.style.display === 'none' ? 'block' : 'none';
    
    // Show API key setup if no key is saved
    if (!apiKey) {
        document.getElementById('api-key-setup').classList.add('show');
    }
});

// Save API key
document.getElementById('save-key').addEventListener('click', () => {
    apiKey = document.getElementById('api-key-input').value.trim();
    if (apiKey) {
        localStorage.setItem('gemini-api-key', apiKey);
        document.getElementById('api-key-setup').classList.remove('show');
        addMessageToChat('bot', 'API key saved! How can I help you with weather information?');
    } else {
        alert('Please enter a valid API key');
    }
});

// Send message function
async function sendMessage() {
    if (!apiKey) {
        document.getElementById('api-key-setup').classList.add('show');
        return;
    }

    const userInput = document.getElementById('chatInput');
    const message = userInput.value.trim();
    
    if (!message) return;

    // Add user message to chat
    addMessageToChat('user', message);
    userInput.value = '';

    // Show typing indicator
    document.getElementById('typing-indicator').style.display = 'block';

    try {
        const response = await fetch(`${API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a weather assistant. Help with this question: ${message}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        const data = await response.json();

        if (response.ok) {
            const botResponse = data.candidates[0].content.parts[0].text;
            addMessageToChat('bot', botResponse);
        } else {
            throw new Error(data.error?.message || 'Failed to get response');
        }
    } catch (error) {
        console.error('Error:', error);
        addMessageToChat('bot', 'Sorry, I encountered an error. Please check your API key and try again.');
    } finally {
        document.getElementById('typing-indicator').style.display = 'none';
    }
}

// Add message to chat
function addMessageToChat(role, message) {
    const chatMessages = document.getElementById('chatAnswerArea');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(role === 'user' ? 'user-message' : 'bot-message');
    
    const messageWithLinks = message.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank">$1</a>'
    );
    
    messageDiv.innerHTML = messageWithLinks;
    chatMessages.appendChild(messageDiv);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

document.getElementById('searchButton').addEventListener('click', sendMessage);

document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
