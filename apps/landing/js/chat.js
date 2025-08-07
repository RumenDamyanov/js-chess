/**
 * Demo Chat Manager for Landing Page
 * Shows the AI chat functionality in demo mode
 */
class LandingChatManager {
    constructor() {
        this.isOpen = false;
        this.apiUrl = 'http://localhost:8080';
        this.demoGameId = null;
        this.demoMessages = [
            { role: 'ai', text: 'Welcome to JS Chess! I\'m your AI chess companion.' },
            { role: 'ai', text: 'I can provide game commentary, tips, and engage in chess-related conversations.' },
            { role: 'ai', text: 'Try any of the chess apps above to experience the full interactive chat!' }
        ];
        this.init();
    }

    init() {
        this.createChatHTML();
        this.bindEvents();
        this.loadDemoMessages();
    }

    createChatHTML() {
        const chatHTML = `
            <div class="chat-container" id="chatContainer">
                <div class="chat-header">
                    <h4>🤖 AI Chess Companion</h4>
                    <span class="chat-status">Demo Mode</span>
                    <button class="chat-toggle" id="chatToggle">×</button>
                </div>
                <div class="chat-messages" id="chatMessages">
                </div>
                <div class="chat-input-container">
                    <input type="text" class="chat-input" id="chatInput" placeholder="Ask me about chess..." maxlength="500">
                    <button class="chat-send" id="chatSend">Send</button>
                </div>
            </div>
            <div class="chat-fab" id="chatFab">
                <span class="chat-icon">💬</span>
                <span class="chat-badge">AI</span>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }

    bindEvents() {
        const chatFab = document.getElementById('chatFab');
        const chatToggle = document.getElementById('chatToggle');
        const chatSend = document.getElementById('chatSend');
        const chatInput = document.getElementById('chatInput');

        chatFab.addEventListener('click', () => this.toggleChat());
        chatToggle.addEventListener('click', () => this.toggleChat());
        chatSend.addEventListener('click', () => this.sendMessage());

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    toggleChat() {
        const container = document.getElementById('chatContainer');
        const fab = document.getElementById('chatFab');

        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            container.classList.add('chat-open');
            fab.style.display = 'none';
        } else {
            container.classList.remove('chat-open');
            fab.style.display = 'flex';
        }
    }

    loadDemoMessages() {
        this.demoMessages.forEach((message, index) => {
            setTimeout(() => {
                this.addMessage(message.text, message.role);
            }, index * 1000);
        });
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTyping();

        try {
            // For demo purposes, create a game first if we don't have one
            if (!this.demoGameId) {
                const gameResponse = await fetch(`${this.apiUrl}/api/games`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({})
                });
                if (gameResponse.ok) {
                    const gameData = await gameResponse.json();
                    this.demoGameId = gameData.id;
                }
            }

            // Use the game-specific chat endpoint if we have a game ID
            const chatUrl = this.demoGameId
                ? `${this.apiUrl}/api/games/${this.demoGameId}/chat`
                : `${this.apiUrl}/api/chat`;

            const response = await fetch(chatUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    context: {
                        mode: 'demo',
                        page: 'landing'
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.hideTyping();
                this.addMessage(data.response || data.reaction, 'ai');
            } else {
                throw new Error('Failed to get AI response');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.hideTyping();
            this.addMessage('Sorry, I\'m having trouble connecting right now. Try one of the chess apps above for the full experience!', 'ai');
        }
    }    addMessage(text, role) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message chat-message-${role}`;

        const avatar = document.createElement('div');
        avatar.className = 'chat-avatar';
        avatar.textContent = role === 'user' ? '👤' : '🤖';

        const content = document.createElement('div');
        content.className = 'chat-content';
        content.textContent = text;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTyping() {
        const messagesContainer = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message chat-message-ai chat-typing';
        typingDiv.id = 'typingIndicator';

        const avatar = document.createElement('div');
        avatar.className = 'chat-avatar';
        avatar.textContent = '🤖';

        const content = document.createElement('div');
        content.className = 'chat-content';
        content.innerHTML = '<span class="typing-dots">...</span>';

        typingDiv.appendChild(avatar);
        typingDiv.appendChild(content);
        messagesContainer.appendChild(typingDiv);

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTyping() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new LandingChatManager();
});
