<template>
  <div :class="['chat-container', { visible: isVisible, collapsed: !isVisible }]">
    <div class="chat-header" @click="toggleVisibility">
      <span>💬 AI Chat</span>
      <span class="chat-toggle">{{ isVisible ? '−' : '+' }}</span>
    </div>

    <div v-if="isVisible" class="chat-content">
      <div class="chat-messages" ref="messagesContainer">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['message', msg.sender, { reaction: msg.isReaction }]"
        >
          <div class="message-content">
            <div class="message-text">{{ msg.message }}</div>
            <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
          </div>
        </div>

        <div v-if="isLoading" class="message ai">
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
      </div>

      <div class="chat-input">
        <textarea
          v-model="inputMessage"
          @keypress="handleKeyPress"
          placeholder="Type a message to the AI..."
          rows="2"
          :disabled="isLoading || !gameId"
        />
        <button
          @click="sendMessage"
          :disabled="isLoading || !inputMessage.trim() || !gameId"
          class="send-button"
        >
          Send
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatComponent',
  props: {
    gameId: {
      type: [String, Number],
      default: null
    },
    gameState: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      messages: [],
      inputMessage: '',
      isLoading: false,
      isVisible: false,
      API_BASE: 'http://localhost:8080',
      moveReactions: [
        "Great move! 👍",
        "Interesting choice! 🤔",
        "Nice tactical play! ⚡",
        "Solid move! 💪",
        "That's a clever idea! 💡",
        "Good positioning! 📍",
        "Well calculated! 🧮",
        "Strategic thinking! 🎯",
        "Impressive! ✨",
        "Keep it up! 🔥"
      ],
      chatResponses: [
        "That's an interesting question about chess strategy!",
        "Chess is such a fascinating game with endless possibilities.",
        "I'd be happy to discuss that move with you!",
        "Great observation about the position!",
        "Chess theory has many different schools of thought on that.",
        "That's a classic chess principle you're referring to!",
        "The position does look quite complex from here.",
        "Chess masters have debated similar questions for centuries!",
        "That's exactly the kind of thinking that improves your game!",
        "You're really getting into the strategic depth of chess!"
      ]
    }
  },
  watch: {
    gameId: {
      handler(newGameId) {
        if (newGameId && this.messages.length === 0) {
          this.addWelcomeMessage();
        }
      },
      immediate: true
    },
    'gameState.move_history': {
      handler(newHistory, oldHistory) {
        if (newHistory && newHistory.length > 0) {
          const oldLength = oldHistory ? oldHistory.length : 0;
          if (newHistory.length > oldLength) {
            const lastMove = newHistory[newHistory.length - 1];
            if (lastMove?.notation) {
              setTimeout(() => {
                this.requestMoveReaction(lastMove.notation);
              }, 1000);
            }
          }
        }
      },
      deep: true
    }
  },
  updated() {
    this.scrollToBottom();
  },
  methods: {
    toggleVisibility() {
      this.isVisible = !this.isVisible;
    },

    addWelcomeMessage() {
      this.messages = [
        {
          id: 'welcome',
          sender: 'ai',
          message: 'Welcome to the chess game! I\'m your AI opponent. Feel free to chat with me about the game!',
          timestamp: new Date().toISOString()
        }
      ];
    },

    async sendMessage() {
      if (!this.inputMessage.trim() || !this.gameId || this.isLoading) {
        return;
      }

      const userMessage = {
        id: Date.now().toString(),
        sender: 'user',
        message: this.inputMessage,
        timestamp: new Date().toISOString()
      };

      this.messages.push(userMessage);
      const messageToSend = this.inputMessage;
      this.inputMessage = '';
      this.isLoading = true;

      try {
        // Debug logging
        if (window.Debug) {
          window.Debug.log('chat', `User message: ${messageToSend}`);
        }

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

        // Get random response
        const randomResponse = this.chatResponses[Math.floor(Math.random() * this.chatResponses.length)];

        const aiMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          message: randomResponse,
          timestamp: new Date().toISOString()
        };

        this.messages.push(aiMessage);

        // Debug logging
        if (window.Debug) {
          window.Debug.log('chat', `AI response: ${randomResponse}`);
        }
      } catch (error) {
        console.error('Error sending chat message:', error);
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          message: 'Sorry, I\'m having trouble responding right now. Please try again.',
          timestamp: new Date().toISOString()
        };
        this.messages.push(errorMessage);
      } finally {
        this.isLoading = false;
      }
    },

    async requestMoveReaction(move) {
      if (!this.gameId || this.isLoading) {
        return;
      }

      this.isLoading = true;

      try {
        // Debug logging
        if (window.Debug) {
          window.Debug.log('chat', `Move reaction for: ${move}`);
        }

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

        // Get random reaction
        const randomReaction = this.moveReactions[Math.floor(Math.random() * this.moveReactions.length)];

        const reactionMessage = {
          id: Date.now().toString(),
          sender: 'ai',
          message: randomReaction,
          timestamp: new Date().toISOString(),
          isReaction: true
        };

        this.messages.push(reactionMessage);

        // Debug logging
        if (window.Debug) {
          window.Debug.log('chat', `AI reaction: ${randomReaction}`);
        }
      } catch (error) {
        console.error('Error getting move reaction:', error);
      } finally {
        this.isLoading = false;
      }
    },

    handleKeyPress(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    },

    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    scrollToBottom() {
      this.$nextTick(() => {
        if (this.$refs.messagesContainer) {
          this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight;
        }
      });
    }
  }
}
</script>

<style scoped>
@import '@shared/chat.css';
</style>
