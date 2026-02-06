// State Variables
let faqOpen = false;
let conversationId = null;
let selectedCategory = null;

// DOM Elements
const faqPanel = document.getElementById('faqPanel');
const faqOverlay = document.getElementById('faqOverlay');
const faqList = document.getElementById('faqList');
const faqSearch = document.getElementById('faqSearch');
const faqCloseBtn = document.getElementById('faqCloseBtn');
const articlesToggle = document.getElementById('articlesToggle');
const layout = document.getElementById('layout');
const welcomeView = document.getElementById('welcomeView');
const chatView = document.getElementById('chatView');
const chatMessages = document.getElementById('chatMessages');
const welcomeInput = document.getElementById('welcomeInput');
const welcomeSendBtn = document.getElementById('welcomeSendBtn');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const backButton = document.getElementById('backButton');
const topicCards = document.querySelectorAll('.topic-card');

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    // Load FAQ data
    await loadFAQ();
    
    // Render FAQ categories
    renderFaqCategories(faqData);
    
    // Set up event listeners
    setupEventListeners();
}

// FAQ Data
let faqData = { categories: [] };

// Load FAQ data
async function loadFAQ() {
    try {
        const response = await fetch('/faq.json');
        faqData = await response.json();
    } catch (error) {
        console.error('Error loading FAQ:', error);
        faqData = { categories: [] };
    }
}

// Set up event listeners
function setupEventListeners() {
    // Topic card clicks
    topicCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            startChat(category);
        });
    });

    // Welcome input (Enter key)
    welcomeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleWelcomeSend();
        }
    });

    welcomeSendBtn.addEventListener('click', handleWelcomeSend);

    // Chat input (Enter key)
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    chatSendBtn.addEventListener('click', sendMessage);

    // Back button
    backButton.addEventListener('click', goBack);

    // FAQ panel toggle
    articlesToggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleFaqPanel();
    });

    faqCloseBtn.addEventListener('click', toggleFaqPanel);
    faqOverlay.addEventListener('click', toggleFaqPanel);

    // FAQ search
    faqSearch.addEventListener('input', (e) => {
        filterFaq(e.target.value);
    });
}

// FAQ Panel Functions
function toggleFaqPanel() {
    faqOpen = !faqOpen;
    
    faqPanel.classList.toggle('open');
    faqOverlay.classList.toggle('visible');
    articlesToggle.classList.toggle('active');
    layout.classList.toggle('faq-open');
}

function toggleCategory(btn) {
    const category = btn.closest('.faq-category');
    category.classList.toggle('expanded');
}

function filterFaq(query) {
    const lowerQuery = query.toLowerCase().trim();
    const categories = document.querySelectorAll('.faq-category');
    
    categories.forEach(category => {
        const items = category.querySelectorAll('.faq-item');
        let hasMatch = false;
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            const matches = text.includes(lowerQuery);
            
            item.style.display = matches || !lowerQuery ? '' : 'none';
            if (matches) hasMatch = true;
        });
        
        // Auto-expand categories with matches
        if (lowerQuery && hasMatch) {
            category.classList.add('expanded');
        } else if (!lowerQuery) {
            category.classList.remove('expanded');
        }
        
        // Hide categories with no matches
        category.style.display = hasMatch || !lowerQuery ? '' : 'none';
    });
}

function renderFaqCategories(data) {
    if (!data.categories || !Array.isArray(data.categories)) {
        return;
    }
    
    faqList.innerHTML = data.categories.map(category => `
        <div class="faq-category">
            <button class="faq-category-btn" onclick="toggleCategory(this)">
                <div>
                    <span class="faq-category-label">${escapeHtml(category.name)}</span>
                    <span class="faq-category-meta">${category.items ? category.items.length : 0} articles</span>
                </div>
                <svg class="faq-category-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                </svg>
            </button>
            <div class="faq-items">
                ${category.items ? category.items.map(item => `
                    <div class="faq-item" onclick="askAbout(this)">
                        ${escapeHtml(item.question)}
                    </div>
                `).join('') : ''}
            </div>
        </div>
    `).join('');
}

function askAbout(el) {
    const topic = el.textContent.trim();
    
    // Close FAQ panel if open
    if (faqOpen) {
        toggleFaqPanel();
    }
    
    // Transition to chat view
    welcomeView.classList.add('hidden');
    chatView.classList.add('active');
    
    // Send message about the topic
    const message = `I have a question about: ${topic}`;
    selectedCategory = 'other'; // Best guess, or could be smarter
    
    addMessage('user', message);
    showTyping();
    
    // Call API
    callMessageAPI(message);
}

// Welcome → Chat Transition
function startChat(category) {
    selectedCategory = category;
    
    // Hide welcome, show chat
    welcomeView.classList.add('hidden');
    chatView.classList.add('active');
    
    // Determine greeting message
    const greetings = {
        status: "I'd like to check on my website build status.",
        edits: "I need help making changes to my website.",
        login: "I'm having trouble logging into my site.",
        other: "I have a question about my website."
    };
    
    const greeting = greetings[category] || greetings.other;
    
    // Add user message
    addMessage('user', greeting);
    
    // Show typing indicator
    showTyping();
    
    // Call API
    callMessageAPI(greeting);
}

function handleWelcomeSend() {
    const message = welcomeInput.value.trim();
    if (!message) return;
    
    welcomeInput.value = '';
    selectedCategory = 'other';
    
    // Transition to chat
    welcomeView.classList.add('hidden');
    chatView.classList.add('active');
    
    // Add user message and send
    addMessage('user', message);
    showTyping();
    callMessageAPI(message);
}

function goBack() {
    chatView.classList.remove('active');
    welcomeView.classList.remove('hidden');
    // Optionally reset conversation
    // conversationId = null;
    // selectedCategory = null;
}

// Message Functions
function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    chatInput.value = '';
    
    // Add user message
    addMessage('user', message);
    
    // Show typing indicator
    showTyping();
    
    // Call API
    callMessageAPI(message);
}

async function callMessageAPI(message) {
    try {
        const response = await fetch('/api/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                conversationId: conversationId,
                category: selectedCategory
            })
        });

        const data = await response.json();

        // Hide typing indicator
        hideTyping();

        if (data.error) {
            addMessage('agent', "Something went wrong on my end. Mind trying that again?");
            return;
        }

        // Save conversation ID
        if (data.conversationId) {
            conversationId = data.conversationId;
        }

        // Show response from API
        addMessage('agent', data.response);

    } catch (error) {
        console.error('Error:', error);
        hideTyping();
        addMessage('agent', "Something went wrong on my end. Mind trying that again?");
    }
}

function addMessage(type, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    if (type === 'agent') {
        // Agent messages: use innerHTML directly (no escaping) to allow HTML from API
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                </svg>
            </div>
            <div class="message-bubble">${text}</div>
        `;
    } else {
        // User messages: escape HTML first
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
            </div>
            <div class="message-bubble">${escapeHtml(text)}</div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message agent';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
            </svg>
        </div>
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

function hideTyping() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Make functions available globally for onclick handlers
window.toggleCategory = toggleCategory;
window.askAbout = askAbout;
