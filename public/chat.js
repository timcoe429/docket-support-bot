// State
let conversationId = null;
let faqData = { categories: [] };

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const faqCategories = document.getElementById('faqCategories');
const faqSearch = document.getElementById('faqSearch');
const startChatLink = document.getElementById('startChatLink');
const chatWelcome = document.getElementById('chatWelcome');
const chatInterface = document.getElementById('chatInterface');
const startChatBtn = document.getElementById('startChatBtn');

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    // Load FAQ data
    await loadFAQ();
    
    // Render FAQ categories
    renderFAQCategories();
    
    // Set up event listeners
    setupEventListeners();
    
    // Don't auto-start chat - wait for button click
}

// Load FAQ data
async function loadFAQ() {
    try {
        const response = await fetch('/faq.json');
        faqData = await response.json();
    } catch (error) {
        console.error('Error loading FAQ:', error);
    }
}

// Render FAQ categories
function renderFAQCategories() {
    faqCategories.innerHTML = faqData.categories.map(category => `
        <div class="faq-category" data-category-id="${category.id}">
            <div class="faq-category-header">
                <div class="faq-category-info">
                    <div class="faq-category-title">${category.name}</div>
                    <div class="faq-category-description">${category.description || ''}</div>
                    <div class="faq-category-meta">${category.items.length} articles</div>
                </div>
                <span class="faq-category-arrow">▼</span>
            </div>
            <div class="faq-items">
                ${category.items.map(item => `
                    <div class="faq-item" data-item-id="${item.id}">
                        <div class="faq-item-question">${item.question}</div>
                        <div class="faq-item-answer">${item.answer}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    // Add click handlers for categories
    document.querySelectorAll('.faq-category-header').forEach(header => {
        header.addEventListener('click', () => {
            const category = header.closest('.faq-category');
            category.classList.toggle('expanded');
        });
    });

    // Add click handlers for FAQ items
    document.querySelectorAll('.faq-item-question').forEach(question => {
        question.addEventListener('click', () => {
            const item = question.closest('.faq-item');
            item.classList.toggle('expanded');
        });
    });
}

// Set up event listeners
function setupEventListeners() {
    // Start chat button
    if (startChatBtn) {
        startChatBtn.addEventListener('click', startChat);
    }

    // Send button click
    sendButton.addEventListener('click', handleSend);

    // Enter key to send (Shift+Enter for new line)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    });

    // FAQ search
    faqSearch.addEventListener('input', handleFAQSearch);

    // Start chat link
    startChatLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (startChatBtn) {
            startChatBtn.click();
        }
    });
}

// Start chat - show initial messages
function startChat() {
    // Hide welcome, show chat
    if (chatWelcome) chatWelcome.style.display = 'none';
    if (chatInterface) chatInterface.style.display = 'flex';
    
    // Show system message
    addSystemMessage('Connected to Docket Website Support');
    
    // Show greeting after short delay
    setTimeout(() => {
        addBotMessage("Hi there! 👋 I'm here to help with your Docket website. What can I help you with today?");
        if (messageInput) messageInput.focus();
    }, 500);
}

// Handle send
async function handleSend() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Add user message
    addUserMessage(message);

    // Show typing indicator
    showTypingIndicator();

    try {
        // Send to API - Claude handles EVERYTHING
        const response = await fetch('/api/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                conversationId: conversationId
            })
        });

        const data = await response.json();

        // Realistic delay (2-4 seconds)
        const delay = 2000 + Math.random() * 2000;
        await new Promise(resolve => setTimeout(resolve, delay));

        // Hide typing indicator
        hideTypingIndicator();

        if (data.error) {
            addBotMessage("I'm having trouble right now. Could you try again in a moment?");
            return;
        }

        // Save conversation ID
        if (data.conversationId) {
            conversationId = data.conversationId;
        }

        // Show response from Claude
        addBotMessage(data.response);

    } catch (error) {
        console.error('Error:', error);
        hideTypingIndicator();
        addBotMessage("Something went wrong on my end. Mind trying that again?");
    }
}

// Add system message
function addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'system-message';
    div.innerHTML = `<span class="system-message-text">${text}</span>`;
    chatMessages.appendChild(div);
    scrollToBottom();
}

// Add bot message
function addBotMessage(content) {
    const quickActions = getQuickActions(content);
    const quickActionsHtml = quickActions.length > 0
        ? `<div class="message-actions">${quickActions.map(action =>
            `<button class="message-action-btn" onclick="sendQuickAction('${action.replace(/'/g, "\\'")}')">${action}</button>`
          ).join('')}</div>`
        : '';

    const div = document.createElement('div');
    div.className = 'message bot';
    div.innerHTML = `
        <div class="message-avatar">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
        </div>
        <div class="message-wrapper">
            <div class="message-content">
                <div class="message-text">${content}</div>
                ${quickActionsHtml}
            </div>
            <div class="message-time">${formatTime()}</div>
        </div>
    `;
    chatMessages.appendChild(div);
    scrollToBottom();
}

// Add user message
function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'message user';
    div.innerHTML = `
        <div class="message-avatar">
            <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        </div>
        <div class="message-wrapper">
            <div class="message-content">
                <div class="message-text">${escapeHtml(text)}</div>
            </div>
            <div class="message-time">${formatTime()}</div>
        </div>
    `;
    chatMessages.appendChild(div);
    scrollToBottom();
}

// Get contextual quick actions based on response content
function getQuickActions(content) {
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('login') || lowerContent.includes('wp-admin') || lowerContent.includes('password')) {
        return ["I can't find the email", "Password doesn't work"];
    }
    if (lowerContent.includes('elementor') || lowerContent.includes('edit') && lowerContent.includes('page')) {
        return ['Show me how', 'I need more help'];
    }
    if (lowerContent.includes('domain') || lowerContent.includes('dns')) {
        return ["I don't understand", 'Can someone help me?'];
    }

    return [];
}

// Send quick action as message
function sendQuickAction(action) {
    // Remove quick actions from last message
    const lastActions = chatMessages.querySelector('.message:last-child .message-actions');
    if (lastActions) {
        lastActions.remove();
    }

    // Set input and send
    messageInput.value = action;
    handleSend();
}

// Make sendQuickAction available globally for onclick handlers
window.sendQuickAction = sendQuickAction;

// Show typing indicator
function showTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'message bot';
    div.id = 'typingIndicator';
    div.innerHTML = `
        <div class="message-avatar">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
        </div>
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    chatMessages.appendChild(div);
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// FAQ search handler
function handleFAQSearch(e) {
    const query = e.target.value.toLowerCase().trim();

    document.querySelectorAll('.faq-category').forEach(category => {
        let categoryHasMatch = false;

        category.querySelectorAll('.faq-item').forEach(item => {
            const question = item.querySelector('.faq-item-question').textContent.toLowerCase();
            const answer = item.querySelector('.faq-item-answer').textContent.toLowerCase();
            const matches = question.includes(query) || answer.includes(query);

            item.style.display = matches || !query ? '' : 'none';
            if (matches) categoryHasMatch = true;
        });

        // Show category if it has matching items
        category.style.display = categoryHasMatch || !query ? '' : 'none';

        // Auto-expand categories with matches
        if (query && categoryHasMatch) {
            category.classList.add('expanded');
        } else if (!query) {
            category.classList.remove('expanded');
        }
    });
}

// Utility: Scroll to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Utility: Format time
function formatTime() {
    return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Utility: Escape HTML for user input
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
