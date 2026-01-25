// Application state
let faqData = null;
let conversationId = null;
let chatConnected = false;
let engagementState = 'none'; // 'none', 'faq', 'chat'
let currentSearchTerm = '';

// DOM elements
const faqPanel = document.getElementById('faqPanel');
const chatPanel = document.getElementById('chatPanel');
const faqCategories = document.getElementById('faqCategories');
const faqSearch = document.getElementById('faqSearch');
const messagesContainer = document.getElementById('messagesContainer');
const chatEmptyState = document.getElementById('chatEmptyState');
const startChatButton = document.getElementById('startChatButton');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const inputContainer = document.getElementById('inputContainer');
const typingIndicator = document.getElementById('typingIndicator');
const faqChatLink = document.getElementById('faq-chat-link');
const mobileTabFaq = document.getElementById('mobileTabFaq');
const mobileTabChat = document.getElementById('mobileTabChat');

// Initialize
async function init() {
    await loadFAQData();
    renderFAQCategories();
    setupEventListeners();
    
    // Handle logo loading errors
    const logos = document.querySelectorAll('img[src*="docket"]');
    logos.forEach(img => {
        img.addEventListener('error', function() {
            this.style.display = 'none';
        });
    });
}

// Load FAQ data
async function loadFAQData() {
    try {
        const response = await fetch('/faq.json');
        if (!response.ok) throw new Error('Failed to load FAQ data');
        faqData = await response.json();
    } catch (error) {
        console.error('Error loading FAQ data:', error);
        faqData = { categories: [] };
    }
}

// Render FAQ categories
function renderFAQCategories(searchTerm = '') {
    if (!faqData || !faqData.categories) return;
    
    faqCategories.innerHTML = '';
    currentSearchTerm = searchTerm.toLowerCase();
    
    faqData.categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'faq-category';
        categoryDiv.dataset.categoryId = category.id;
        
        // Filter items based on search
        let visibleItems = category.items;
        if (currentSearchTerm) {
            visibleItems = category.items.filter(item => {
                const questionMatch = item.question.toLowerCase().includes(currentSearchTerm);
                const keywordMatch = item.keywords?.some(kw => 
                    kw.toLowerCase().includes(currentSearchTerm)
                );
                return questionMatch || keywordMatch;
            });
        }
        
        // Only show category if it has visible items
        if (visibleItems.length === 0 && currentSearchTerm) {
            return;
        }
        
        // Auto-expand if searching
        if (currentSearchTerm && visibleItems.length > 0) {
            categoryDiv.classList.add('expanded');
        }
        
        const header = document.createElement('div');
        header.className = 'faq-category-header';
        header.innerHTML = `
            <div>
                <div class="faq-category-title">${category.name}</div>
                ${category.description ? `<div class="faq-category-description">${category.description}</div>` : ''}
            </div>
            <div class="faq-category-toggle">▼</div>
        `;
        
        const itemsDiv = document.createElement('div');
        itemsDiv.className = 'faq-category-items';
        
        visibleItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'faq-item';
            itemDiv.dataset.itemId = item.id;
            
            const question = document.createElement('div');
            question.className = 'faq-question';
            question.textContent = item.question;
            
            // Highlight search terms
            if (currentSearchTerm) {
                const regex = new RegExp(`(${escapeRegex(currentSearchTerm)})`, 'gi');
                question.innerHTML = item.question.replace(regex, '<span class="highlight">$1</span>');
            }
            
            const answer = document.createElement('div');
            answer.className = 'faq-answer';
            const answerContent = document.createElement('div');
            answerContent.className = 'faq-answer-content';
            answerContent.innerHTML = item.answer;
            answer.appendChild(answerContent);
            
            itemDiv.appendChild(question);
            itemDiv.appendChild(answer);
            
            // Expand on click
            question.addEventListener('click', () => {
                itemDiv.classList.toggle('expanded');
                setEngagement('faq');
            });
            
            itemsDiv.appendChild(itemDiv);
        });
        
        categoryDiv.appendChild(header);
        categoryDiv.appendChild(itemsDiv);
        
        // Toggle category on header click
        header.addEventListener('click', () => {
            categoryDiv.classList.toggle('expanded');
            setEngagement('faq');
        });
        
        faqCategories.appendChild(categoryDiv);
    });
}

// Escape regex special characters
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Set engagement state and resize panels
function setEngagement(state) {
    if (engagementState === state) return;
    
    engagementState = state;
    
    if (window.innerWidth > 768) {
        // Desktop: resize panels
        if (state === 'faq') {
            faqPanel.classList.remove('minimized');
            faqPanel.classList.add('expanded');
            chatPanel.classList.remove('expanded');
            chatPanel.classList.add('minimized');
        } else if (state === 'chat') {
            chatPanel.classList.remove('minimized');
            chatPanel.classList.add('expanded');
            faqPanel.classList.remove('expanded');
            faqPanel.classList.add('minimized');
        } else {
            // Reset to 50/50
            faqPanel.classList.remove('expanded', 'minimized');
            chatPanel.classList.remove('expanded', 'minimized');
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // FAQ search
    faqSearch.addEventListener('input', (e) => {
        renderFAQCategories(e.target.value);
        if (e.target.value) {
            setEngagement('faq');
        }
    });
    
    // Start chat button
    startChatButton.addEventListener('click', startChat);
    
    // FAQ footer link - triggers chat expansion and connection
    faqChatLink.addEventListener('click', (e) => {
        e.preventDefault();
        setEngagement('chat');
        if (window.innerWidth < 768) {
            switchToTab('chat');
        }
        startChat();
    });
    
    // Message form
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message && !messageInput.disabled) {
            messageInput.value = '';
            await sendMessage(message);
        }
    });
    
    // Mobile tabs
    mobileTabFaq.addEventListener('click', () => switchToTab('faq'));
    mobileTabChat.addEventListener('click', () => switchToTab('chat'));
    
    // Panel click handlers for minimized views (desktop)
    const faqToggleOverlay = faqPanel.querySelector('.panel-toggle-overlay');
    const chatToggleOverlay = chatPanel.querySelector('.panel-toggle-overlay');
    
    if (faqToggleOverlay) {
        faqToggleOverlay.addEventListener('click', () => {
            setEngagement('faq');
        });
    }
    
    if (chatToggleOverlay) {
        chatToggleOverlay.addEventListener('click', () => {
            setEngagement('chat');
        });
    }
}

// Switch mobile tab
function switchToTab(tab) {
    if (tab === 'faq') {
        faqPanel.classList.remove('hidden');
        chatPanel.classList.remove('active');
        mobileTabFaq.classList.add('active');
        mobileTabChat.classList.remove('active');
    } else {
        faqPanel.classList.add('hidden');
        chatPanel.classList.add('active');
        mobileTabChat.classList.add('active');
        mobileTabFaq.classList.remove('active');
    }
}

// Start chat connection sequence
async function startChat() {
    if (chatConnected) return;
    
    // Hide empty state
    chatEmptyState.style.display = 'none';
    
    // Show input container (disabled)
    inputContainer.style.display = 'block';
    messageInput.disabled = true;
    sendButton.disabled = true;
    
    // Show connecting message
    addSystemMessage('Connecting you with a support agent...');
    showTypingIndicator();
    
    // Random delay between 5-8 seconds
    const delay = 5000 + Math.random() * 3000;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    hideTypingIndicator();
    addSystemMessage('Connected! You\'re now chatting with the Docket Support Team.');
    
    // Wait 1 second, then show first bot message
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    addAgentMessage('Hi there! How can I help you today?');
    
    // Enable input
    messageInput.disabled = false;
    sendButton.disabled = false;
    chatConnected = true;
    setEngagement('chat');
    
    // Focus input
    messageInput.focus();
}

// Add system message
function addSystemMessage(content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system-message';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Add agent message
function addAgentMessage(content, timestamp = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message agent-message';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'agent-avatar';
    const logoImg = document.createElement('img');
    logoImg.src = 'https://www.yourdocket.com/wp-content/uploads/2024/11/highres-blue-docket-dumpster-software.png';
    logoImg.alt = 'Docket';
    logoImg.style.width = '20px';
    logoImg.addEventListener('error', function() {
        this.style.display = 'none';
    });
    avatarDiv.appendChild(logoImg);
    
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'agent-message-content-wrapper';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = content;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = timestamp || formatTime(new Date());
    
    contentWrapper.appendChild(contentDiv);
    contentWrapper.appendChild(timeDiv);
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentWrapper);
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Add user message
function addUserMessage(content, timestamp = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = timestamp || formatTime(new Date());
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Format time
function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });
}

// Show typing indicator
function showTypingIndicator() {
    typingIndicator.style.display = 'block';
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// Scroll to bottom
function scrollToBottom() {
    setTimeout(() => {
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
}

// Send message
async function sendMessage(message) {
    try {
        // Disable input
        messageInput.disabled = true;
        sendButton.disabled = true;
        
        // Add user message
        addUserMessage(message);
        setEngagement('chat');
        
        // Show typing indicator
        showTypingIndicator();
        
        // Random delay 1-3 seconds before sending
        const delay = 1000 + Math.random() * 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Send to API
        const response = await fetch('/api/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to send message');
        }
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Small delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Add agent response
        addAgentMessage(data.response);
        
        if (data.conversationId) {
            conversationId = data.conversationId;
        }
        
        if (data.escalated) {
            // Show escalation message if not already in response
            if (!data.response.includes('Kayla') && !data.response.includes('escalated')) {
                setTimeout(() => {
                    addAgentMessage('I\'ve escalated this to our support team. They\'ll follow up with you shortly.');
                }, 1000);
            }
        }
    } catch (error) {
        console.error('Message error:', error);
        hideTypingIndicator();
        addAgentMessage('Sorry, I encountered an error. Please try again.');
    } finally {
        // Re-enable input
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
