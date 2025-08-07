// Chat functionality for jQuery app
class ChatManager {
    constructor() {
        this.messages = [];
        this.isLoading = false;
        this.isVisible = false;
        this.API_BASE = 'http://localhost:8080';
        this.gameId = null;
        this.gameState = null;

        this.initializeChat();
    }

    initializeChat() {
        // Bind event handlers using jQuery
        $('#chat-container .chat-header').on('click', () => this.toggle());
        $('#send-button').on('click', () => this.sendMessage());
        $('#chat-input-text').on('keypress', (e) => this.handleKeyPress(e));

        // Add welcome message when game starts
        this.addWelcomeMessage();
    }

    setGameState(gameId, gameState) {
        const oldMoveCount = this.gameState?.move_history?.length || 0;
        this.gameId = gameId;
        this.gameState = gameState;

        // Add welcome message if first time
        if (gameId && this.messages.length === 0) {
            this.addWelcomeMessage();
        }

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
    }

    addWelcomeMessage() {
        this.messages = [{
            id: 'welcome',
            sender: 'ai',
            message: 'Welcome to the chess game! I\'m your AI opponent. Feel free to chat with me about the game!',
            timestamp: new Date().toISOString()
        }];
        this.renderMessages();
    }

    async sendMessage() {
        const message = $('#chat-input-text').val().trim();
        if (!message || !this.gameId || this.isLoading) {
            return;
        }

        // Add user message
        const userMessage = {
            id: Date.now().toString(),
            sender: 'user',
            message: message,
            timestamp: new Date().toISOString()
        };

        this.messages.push(userMessage);
        $('#chat-input-text').val(''); // Clear input
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

            // Simulate thinking delay
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

            // Add AI response
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
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                message: 'Sorry, I\'m having trouble responding right now. Please try again.',
                timestamp: new Date().toISOString()
            };
            this.messages.push(errorMessage);
            this.renderMessages();
        } finally {
            this.setLoading(false);
        }
    }

    async requestMoveReaction(move) {
        if (!this.gameId || this.isLoading) {
            return;
        }

        // Disable move reactions until backend AI is configured
        return;

        // Original code commented out until backend AI is configured
        /*
        this.setLoading(true);

        try {
            const response = await $.ajax({
                url: `${this.API_BASE}/api/games/${this.gameId}/react`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ move: move })
            });

            const reactionMessage = {
                id: Date.now().toString(),
                sender: 'ai',
                message: response.reaction,
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
        const $container = $('#chat-messages');
        $container.empty();

        this.messages.forEach(msg => {
            const messageClasses = `message ${msg.sender}${msg.isReaction ? ' reaction' : ''}`;
            const $messageDiv = $(`
                <div class="${messageClasses}">
                    <div class="message-content">
                        <div class="message-text">${this.escapeHtml(msg.message)}</div>
                        <div class="message-time">${this.formatTime(msg.timestamp)}</div>
                    </div>
                </div>
            `);

            $container.append($messageDiv);
        });

        // Add typing indicator if loading
        if (this.isLoading) {
            const $typingDiv = $(`
                <div class="message ai">
                    <div class="message-content">
                        <div class="message-text">
                            <div class="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            $container.append($typingDiv);
        }

        this.scrollToBottom();
    }

    setLoading(loading) {
        this.isLoading = loading;
        $('#send-button').prop('disabled', loading || !this.gameId);
        $('#chat-input-text').prop('disabled', loading || !this.gameId);
        this.renderMessages();
    }

    toggle() {
        this.isVisible = !this.isVisible;
        const $container = $('#chat-container');
        const $content = $('#chat-content');
        const $toggle = $('#chat-toggle');

        if (this.isVisible) {
            $container.removeClass('collapsed').addClass('visible');
            $content.show();
            $toggle.text('−');
        } else {
            $container.removeClass('visible').addClass('collapsed');
            $content.hide();
            $toggle.text('+');
        }
    }

    scrollToBottom() {
        const $container = $('#chat-messages');
        if ($container.length) {
            $container.scrollTop($container[0].scrollHeight);
        }
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        return $('<div>').text(text).html();
    }

    handleKeyPress(event) {
        if (event.which === 13 && !event.shiftKey) { // Enter key
            event.preventDefault();
            this.sendMessage();
        }
    }
}

// Initialize chat manager when document is ready
$(document).ready(function() {
    window.chatManager = new ChatManager();
});

// Global functions for HTML onclick handlers
function sendChatMessage() {
    if (window.chatManager) {
        const input = $('#chat-input-text');
        if (input.val().trim()) {
            window.chatManager.sendMessage(input.val().trim());
            input.val('');
        }
    }
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
    }
}

function toggleChat() {
    if (window.chatManager) {
        window.chatManager.toggle();
    }
}
