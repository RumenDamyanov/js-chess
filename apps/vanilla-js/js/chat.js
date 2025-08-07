// Chat functionality for Vanilla JS app
class ChatManager {
    constructor() {
        this.messages = [];
        this.isLoading = false;
        this.isVisible = false;
        this.API_BASE = 'http://localhost:8080';
        this.gameId = null;
        this.gameState = null;

        Debug.log('chatManager', 'ChatManager initialized');
        this.initializeChat();
    }

    initializeChat() {
        Debug.log('chatManager', 'Initializing chat functionality');
        // Add welcome message when game starts
        this.addWelcomeMessage();

        // Listen for game state changes
        this.observeGameChanges();
    }

    setGameState(gameId, gameState) {
        const oldMoveCount = this.gameState?.move_history?.length || 0;
        this.gameId = gameId;
        this.gameState = gameState;

        Debug.log('chatManager', 'Game state updated - Game ID:', gameId, 'Move count:', gameState?.move_history?.length || 0);

        // Add welcome message if first time
        if (gameId && this.messages.length === 0) {
            this.addWelcomeMessage();
        }

        // Automatic move reactions disabled to prevent API errors
        // The chat bot will respond to user messages instead
        /*
        // Check for new moves and react
        const newMoveCount = gameState?.move_history?.length || 0;
        if (newMoveCount > oldMoveCount && newMoveCount > 0) {
            const lastMove = gameState.move_history[newMoveCount - 1];
            if (lastMove?.notation) {
                setTimeout(() => {
                    this.requestMoveReaction(lastMove.notation);
                }, 1000);
            }
        }
        */
    }

    addWelcomeMessage() {
        this.messages = [{
            id: 'welcome',
            sender: 'ai',
            message: 'Welcome to Chess! I\'m here to chat while you play. Feel free to ask about strategy, openings, or just chat about the game. Good luck!',
            timestamp: new Date().toISOString()
        }];
        this.renderMessages();
    }

    async sendMessage(message) {
        if (!message.trim()) return;

        // Add user message immediately
        const userMessage = {
            id: Date.now().toString(),
            sender: 'user',
            message: message,
            timestamp: new Date().toISOString()
        };

        this.messages.push(userMessage);
        this.renderMessages();
        this.setLoading(true);

        try {
            // Create a simple chat bot with predefined responses
            const responses = [
                "That's an interesting move! What's your strategy here?",
                "I see you're developing your pieces nicely.",
                "Good thinking! Chess is all about planning ahead.",
                "Nice! Are you going for a particular opening?",
                "Interesting choice. I'm curious to see how this develops.",
                "Great move! Chess requires both tactics and strategy.",
                "You're playing well! Each move shapes the game.",
                "I like your approach to this position.",
                "Chess is such a beautiful game, don't you think?",
                "Every move tells a story. What's yours?"
            ];

            // Simple response based on message content
            let responseText;
            const lowerMessage = message.toLowerCase();

            if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
                responseText = "Hello! Great to chat while we play. How are you enjoying the game?";
            } else if (lowerMessage.includes('strategy') || lowerMessage.includes('plan')) {
                responseText = "Strategy is key in chess! What's your main plan for this position?";
            } else if (lowerMessage.includes('opening')) {
                responseText = "Openings set the tone for the entire game. Do you have a favorite opening?";
            } else if (lowerMessage.includes('help') || lowerMessage.includes('hint')) {
                responseText = "I'd love to help! Look for ways to improve your piece activity and control the center.";
            } else {
                // Random response from the array
                responseText = responses[Math.floor(Math.random() * responses.length)];
            }

            const aiMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                message: responseText,
                timestamp: new Date().toISOString()
            };

            this.messages.push(aiMessage);
            this.renderMessages();

        } catch (error) {
            Debug.error('chatManager', 'Error sending chat message:', error);

            // Add error message
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                message: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date().toISOString()
            };

            this.messages.push(errorMessage);
            this.renderMessages();
        } finally {
            this.setLoading(false);
        }
    }

    async requestMoveReaction(move) {
        if (!this.gameId) {
            Debug.warn('chatManager', 'Cannot request move reaction: no game ID set');
            return;
        }

        Debug.log('chatManager', 'Move reaction requested for move:', move);
        // Add a placeholder reaction message
        const reactionMessage = {
            id: Date.now().toString(),
            sender: 'ai',
            message: `Interesting move: ${move}! AI reactions are currently disabled.`,
            timestamp: new Date().toISOString(),
            isReaction: true
        };

        this.messages.push(reactionMessage);
        this.renderMessages();
        return;

        // Original code commented out until backend AI is configured
        /*
        this.setLoading(true);

        try {
            const response = await fetch(`${this.API_BASE}/api/games/${this.gameId}/react`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ move: move })
            });

            if (!response.ok) {
                const errorText = await response.text();
                Debug.error('chatManager', 'Move reaction API error:', response.status, errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();

            const reactionMessage = {
                id: Date.now().toString(),
                sender: 'ai',
                message: data.reaction,
                timestamp: new Date().toISOString(),
                isReaction: true
            };

            this.messages.push(reactionMessage);
            this.renderMessages();
        } catch (error) {
            Debug.error('chatManager', 'Error getting move reaction:', error);
        } finally {
            this.setLoading(false);
        }
        */
    }

    renderMessages() {
        const container = document.getElementById('chat-messages');
        if (!container) return;

        container.innerHTML = '';

        this.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.sender}${msg.isReaction ? ' reaction' : ''}`;

            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${this.escapeHtml(msg.message)}</div>
                    <div class="message-time">${this.formatTime(msg.timestamp)}</div>
                </div>
            `;

            container.appendChild(messageDiv);
        });

        // Add typing indicator if loading
        if (this.isLoading) {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message ai';
            typingDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-text">
                        <div class="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(typingDiv);
        }

        this.scrollToBottom();
    }

    setLoading(loading) {
        this.isLoading = loading;
        const sendButton = document.getElementById('send-button');
        const inputText = document.getElementById('chat-input-text');

        if (sendButton) {
            sendButton.disabled = loading || !this.gameId;
        }
        if (inputText) {
            inputText.disabled = loading || !this.gameId;
        }

        this.renderMessages();
    }

    toggle() {
        this.isVisible = !this.isVisible;
        const container = document.getElementById('chat-container');
        const content = document.getElementById('chat-content');
        const toggle = document.getElementById('chat-toggle');

        if (this.isVisible) {
            container.classList.remove('collapsed');
            container.classList.add('visible');
            content.style.display = 'flex';
            toggle.textContent = '−';
        } else {
            container.classList.remove('visible');
            container.classList.add('collapsed');
            content.style.display = 'none';
            toggle.textContent = '+';
        }
    }

    scrollToBottom() {
        const container = document.getElementById('chat-messages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    observeGameChanges() {
        // This will be called by the main chess game when state changes
        // The main game needs to call chatManager.setGameState(gameId, gameState)
    }
}

// Global chat manager instance
const chatManager = new ChatManager();

// Global functions for HTML event handlers
function toggleChat() {
    chatManager.toggle();
}

function sendChatMessage() {
    const input = document.getElementById('chat-input-text');
    if (input && input.value.trim()) {
        chatManager.sendMessage(input.value.trim());
        input.value = '';
    }
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
    }
}
