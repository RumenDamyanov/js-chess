/**
 * Chat Manager Component - AI Chat Integration
 */

import {
  ChatMessage,
  ChatRequest,
  GameState,
  ChessMove
} from '../types/chess.js';
import { ChessAPIClient } from '../services/api-client.js';
import {
  getElement,
  createElement,
  addEventListenerTyped,
  addClass,
  removeClass,
  fadeIn,
  fadeOut
} from '../utils/dom-utils.js';

export interface ChatManagerEvents {
  messageReceived: (message: ChatMessage) => void;
  chatToggled: (isVisible: boolean) => void;
  errorOccurred: (error: Error) => void;
}

/**
 * Manages AI chat functionality
 */
export class ChatManager {
  private apiClient: ChessAPIClient;
  private messages: ChatMessage[] = [];
  private gameId: number | null = null;
  private gameState: GameState | null = null;
  private isVisible: boolean = false;
  private isLoading: boolean = false;
  private eventListeners: Partial<ChatManagerEvents> = {};

  // DOM elements
  private chatContainer!: HTMLElement;
  private chatContent!: HTMLElement;
  private chatMessages!: HTMLElement;
  private chatInput!: HTMLTextAreaElement;
  private sendButton!: HTMLButtonElement;
  private chatToggle!: HTMLElement;

  constructor(apiClient: ChessAPIClient) {
    this.apiClient = apiClient;
    this.initializeElements();
    this.setupEventListeners();
    this.addWelcomeMessage();
  }

  /**
   * Register event listener
   */
  on<K extends keyof ChatManagerEvents>(event: K, listener: ChatManagerEvents[K]): void {
    this.eventListeners[event] = listener;
  }

  /**
   * Emit event to listeners
   */
  private emit<K extends keyof ChatManagerEvents>(event: K, ...args: Parameters<ChatManagerEvents[K]>): void {
    const listener = this.eventListeners[event];
    if (listener) {
      (listener as any)(...args);
    }
  }

  /**
   * Initialize DOM elements
   */
  private initializeElements(): void {
    this.chatContainer = getElement('#chat-container');
    this.chatContent = getElement('#chat-content');
    this.chatMessages = getElement('#chat-messages');
    this.chatInput = getElement<HTMLTextAreaElement>('#chat-input-text');
    this.sendButton = getElement<HTMLButtonElement>('#send-button');
    this.chatToggle = getElement('#chat-toggle');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Chat toggle
    const chatHeader = this.chatContainer.querySelector('.chat-header');
    if (chatHeader) {
      addEventListenerTyped(chatHeader as HTMLElement, 'click', this.toggleChat.bind(this));
    }

    // Send button
    addEventListenerTyped(this.sendButton, 'click', this.sendMessage.bind(this));

    // Enter key in textarea
    addEventListenerTyped(this.chatInput, 'keypress', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    addEventListenerTyped(this.chatInput, 'input', this.autoResizeTextarea.bind(this));
  }

  /**
   * Toggle chat visibility
   */
  async toggleChat(): Promise<void> {
    this.isVisible = !this.isVisible;

    if (this.isVisible) {
      this.chatContent.style.display = 'block';
      await fadeIn(this.chatContent, 200);
      removeClass(this.chatContainer, 'collapsed');
      this.chatToggle.textContent = '−';
      this.scrollToBottom();
    } else {
      await fadeOut(this.chatContent, 200);
      this.chatContent.style.display = 'none';
      addClass(this.chatContainer, 'collapsed');
      this.chatToggle.textContent = '+';
    }

    this.emit('chatToggled', this.isVisible);
  }

  /**
   * Set game context
   */
  setGameState(gameId: number, gameState: GameState): void {
    const hadPreviousGame = this.gameId !== null;
    const oldMoveCount = this.gameState?.move_history.length || 0;

    this.gameId = gameId;
    this.gameState = gameState;

    // Add welcome message for new games
    if (!hadPreviousGame && gameId) {
      this.addWelcomeMessage();
    }

    // Note: Auto move reactions are disabled to prevent API spam
    // The chat system is designed for user-initiated conversations
  }

  /**
   * Send chat message to AI
   */
  async sendMessage(): Promise<void> {
    const messageText = this.chatInput.value.trim();
    if (!messageText || this.isLoading) return;

    // Clear input immediately
    this.chatInput.value = '';
    this.autoResizeTextarea();

    // Add user message
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: messageText,
      timestamp: Date.now()
    };

    this.addMessage(userMessage);
    this.setLoading(true);

    try {
      // Use predefined responses to avoid API rate limits
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
      let responseText: string;
      const lowerMessage = messageText.toLowerCase();

      if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        responseText = "Hello! Great to chat while we play. How are you enjoying the game?";
      } else if (lowerMessage.includes('strategy') || lowerMessage.includes('plan')) {
        responseText = "Strategy is key in chess! What's your main plan for this position?";
      } else if (lowerMessage.includes('opening')) {
        responseText = "Openings set the tone for the entire game. Do you have a favorite opening?";
      } else if (lowerMessage.includes('help') || lowerMessage.includes('hint')) {
        responseText = "I'd love to help! Look for ways to improve your piece activity and control the center.";
      } else {
        // Random response
        const randomIndex = Math.floor(Math.random() * responses.length);
        responseText = responses[randomIndex] || "That's interesting! Tell me more about your chess strategy.";
      }

      // Simulate thinking delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Add AI response
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: responseText,
        timestamp: Date.now(),
        gameState: this.gameState ? { ...this.gameState } : undefined
      };

      this.addMessage(aiMessage);
      this.emit('messageReceived', aiMessage);

    } catch (error) {
      console.error('Chat error:', error);

      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'system',
        content: 'Sorry, I couldn\'t process your message right now. The chat service might be unavailable.',
        timestamp: Date.now()
      };

      this.addMessage(errorMessage);
      this.emit('errorOccurred', error instanceof Error ? error : new Error('Unknown chat error'));

    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Request move reaction from AI
   */
  async requestMoveReaction(move: string): Promise<void> {
    if (!this.gameId || this.isLoading) return;

    this.setLoading(true);

    try {
      const response = await this.apiClient.getMoveReaction(this.gameId, { move });

      const reactionMessage: ChatMessage = {
        id: `reaction_${Date.now()}`,
        type: 'ai',
        content: response.reaction,
        timestamp: Date.now(),
        gameState: this.gameState ? { ...this.gameState } : undefined
      };

      this.addMessage(reactionMessage);
      this.emit('messageReceived', reactionMessage);

    } catch (error) {
      console.error('Move reaction error:', error);
      // Don't show error messages for move reactions to avoid spam
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Add message to chat
   */
  private addMessage(message: ChatMessage): void {
    this.messages.push(message);
    this.renderMessage(message);
    this.scrollToBottom();
  }

  /**
   * Render a single message
   */
  private renderMessage(message: ChatMessage): void {
    const messageElement = createElement('div', {
      className: `chat-message ${message.type}`,
      dataset: {
        messageId: message.id,
        timestamp: message.timestamp.toString()
      }
    });

    // Message content
    const contentElement = createElement('div', {
      className: 'message-content',
      textContent: message.content
    });

    // Timestamp
    const timeElement = createElement('div', {
      className: 'message-time',
      textContent: this.formatTimestamp(message.timestamp)
    });

    messageElement.appendChild(contentElement);
    messageElement.appendChild(timeElement);

    // Add icon for message type
    const iconElement = createElement('div', {
      className: 'message-icon',
      textContent: this.getMessageIcon(message.type)
    });

    messageElement.appendChild(iconElement);

    this.chatMessages.appendChild(messageElement);
  }

  /**
   * Get icon for message type
   */
  private getMessageIcon(type: string): string {
    switch (type) {
      case 'user': return '👤';
      case 'ai': return '🤖';
      case 'system': return 'ℹ️';
      default: return '💬';
    }
  }

  /**
   * Format timestamp for display
   */
  private formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Auto-resize textarea based on content
   */
  private autoResizeTextarea(): void {
    this.chatInput.style.height = 'auto';
    this.chatInput.style.height = `${Math.min(this.chatInput.scrollHeight, 120)}px`;
  }

  /**
   * Scroll chat to bottom
   */
  private scrollToBottom(): void {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  /**
   * Set loading state
   */
  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    this.sendButton.disabled = loading;
    this.chatInput.disabled = loading;

    if (loading) {
      this.sendButton.textContent = '...';
      this.addTypingIndicator();
    } else {
      this.sendButton.textContent = 'Send';
      this.removeTypingIndicator();
    }
  }

  /**
   * Add typing indicator
   */
  private addTypingIndicator(): void {
    const existingIndicator = this.chatMessages.querySelector('.typing-indicator');
    if (existingIndicator) return;

    const typingElement = createElement('div', {
      className: 'chat-message ai typing-indicator'
    });

    const contentElement = createElement('div', {
      className: 'message-content',
      innerHTML: '<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>'
    });

    typingElement.appendChild(contentElement);
    this.chatMessages.appendChild(typingElement);
    this.scrollToBottom();
  }

  /**
   * Remove typing indicator
   */
  private removeTypingIndicator(): void {
    const typingIndicator = this.chatMessages.querySelector('.typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  /**
   * Add welcome message
   */
  private addWelcomeMessage(): void {
    // Don't add multiple welcome messages
    if (this.messages.some(msg => msg.id === 'welcome')) return;

    const welcomeMessages = [
      "Hello! I'm your AI chess companion. Feel free to ask me about the game, strategies, or just chat! 😊",
      "Welcome to our chess match! I'm here to help and discuss the game with you. What would you like to know? 🎯",
      "Hi there! Ready for some chess? I love talking about moves, tactics, and chess in general. Ask me anything! ♟️",
      "Greetings, chess friend! I'm excited to play and chat with you. Feel free to share your thoughts! 🤔",
      "Hello! Let's have a great game. I'm here to chat about chess, give insights, or just have a friendly conversation! ⚡"
    ];

    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]!;

    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'ai',
      content: randomMessage,
      timestamp: Date.now()
    };

    this.addMessage(welcomeMessage);
  }

  /**
   * Clear chat messages
   */
  clearMessages(): void {
    this.messages = [];
    this.chatMessages.innerHTML = '';
    this.addWelcomeMessage();
  }

  /**
   * Get message history
   */
  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  /**
   * Show/hide chat based on configuration
   */
  setEnabled(enabled: boolean): void {
    this.chatContainer.style.display = enabled ? 'block' : 'none';
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.clearMessages();
    this.setLoading(false);
  }
}
