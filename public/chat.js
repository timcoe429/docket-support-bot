// Chat application state
let conversationId = null;

// DOM elements
const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messagesContainer = document.getElementById('messagesContainer');
const typingIndicator = document.getElementById('typingIndicator');
const quickHelpLinks = document.querySelectorAll('.quick-help-link');

// Initialize
function init() {
    // Show bot greeting
    addBotGreeting();
    
    // Set up event listeners
    setupEventListeners();
    
    // Focus input
    messageInput.focus();
}

// Bot greeting
function addBotGreeting() {
    addMessage("Hi! How can I help you today?", 'assistant');
}

// Set up event listeners
function setupEventListeners() {
    // Message form submission
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message) {
            messageInput.value = '';
            await sendMessage(message);
        }
    });

    // Quick help links
    quickHelpLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const question = link.getAttribute('data-question');
            if (question) {
                // Close mobile menu if open
                closeMobileMenu();
                await sendMessage(question);
            }
        });
    });

    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Close menu on backdrop click
    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', closeMobileMenu);
    }

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            closeMobileMenu();
        }
    });
}

// Mobile menu functions
function toggleMobileMenu() {
    sidebar.classList.toggle('open');
    sidebarBackdrop.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

function closeMobileMenu() {
    sidebar.classList.remove('open');
    sidebarBackdrop.classList.remove('active');
    document.body.style.overflow = '';
}

// Add message to chat
function addMessage(content, role, timestamp = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;

    if (role === 'assistant') {
        // Bot message with avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'bot-avatar';
        avatarDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
        
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'bot-message-content-wrapper';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = timestamp || formatTime(new Date());
        
        contentWrapper.appendChild(contentDiv);
        contentWrapper.appendChild(timeDiv);
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentWrapper);
    } else {
        // User message
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = timestamp || formatTime(new Date());
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
    }

    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
    
    // Re-initialize Lucide icons for new SVG elements
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
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

// Show loading state
function showLoading() {
    sendButton.disabled = true;
    messageInput.disabled = true;
    showTypingIndicator();
}

// Hide loading state
function hideLoading() {
    sendButton.disabled = false;
    messageInput.disabled = false;
    hideTypingIndicator();
}

// Scroll to bottom smoothly
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
        showLoading();
        addMessage(message, 'user');

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

        // Hide typing indicator before adding response
        hideTypingIndicator();
        
        // Small delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 200));
        
        addMessage(data.response, 'assistant');

        if (data.conversationId) {
            conversationId = data.conversationId;
        }

        if (data.escalated) {
            // Show escalation message if not already in response
            if (!data.response.includes('Kayla')) {
                setTimeout(() => {
                    addMessage("I've escalated this to Kayla. She'll follow up with you shortly.", 'assistant');
                }, 1000);
            }
        }
    } catch (error) {
        console.error('Message error:', error);
        hideTypingIndicator();
        addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
    } finally {
        hideLoading();
        messageInput.focus();
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
