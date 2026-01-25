// Chat application state
let sessionId = null;
let clientEmail = null;
let conversationId = null;

// DOM elements
const verificationScreen = document.getElementById('verificationScreen');
const chatScreen = document.getElementById('chatScreen');
const verificationForm = document.getElementById('verificationForm');
const emailInput = document.getElementById('emailInput');
const verifyButton = document.getElementById('verifyButton');
const verificationError = document.getElementById('verificationError');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messagesContainer = document.getElementById('messagesContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const closeButton = document.getElementById('closeButton');

// Check for existing session in localStorage
function loadSession() {
    const savedSessionId = localStorage.getItem('docketSessionId');
    const savedEmail = localStorage.getItem('docketClientEmail');
    const savedExpiry = localStorage.getItem('docketSessionExpiry');

    if (savedSessionId && savedEmail && savedExpiry) {
        // Check if session is still valid (not expired)
        if (new Date(savedExpiry) > new Date()) {
            sessionId = savedSessionId;
            clientEmail = savedEmail;
            showChatScreen();
            return true;
        } else {
            // Clear expired session
            clearSession();
        }
    }
    return false;
}

// Save session to localStorage
function saveSession(sessionIdValue, email, expiresAt) {
    localStorage.setItem('docketSessionId', sessionIdValue);
    localStorage.setItem('docketClientEmail', email);
    localStorage.setItem('docketSessionExpiry', expiresAt);
}

// Clear session from localStorage
function clearSession() {
    localStorage.removeItem('docketSessionId');
    localStorage.removeItem('docketClientEmail');
    localStorage.removeItem('docketSessionExpiry');
    sessionId = null;
    clientEmail = null;
    conversationId = null;
}

// Show verification screen
function showVerificationScreen() {
    verificationScreen.style.display = 'block';
    chatScreen.style.display = 'none';
    verificationError.classList.remove('show');
    emailInput.value = '';
}

// Show chat screen
function showChatScreen() {
    verificationScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
    messageInput.focus();
}

// Show error message
function showError(message) {
    verificationError.textContent = message;
    verificationError.classList.add('show');
}

// Add message to chat
function addMessage(content, role, timestamp = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = timestamp || formatTime(new Date());

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Format time
function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });
}

// Show loading indicator
function showLoading() {
    loadingIndicator.style.display = 'block';
    sendButton.disabled = true;
    messageInput.disabled = true;
}

// Hide loading indicator
function hideLoading() {
    loadingIndicator.style.display = 'none';
    sendButton.disabled = false;
    messageInput.disabled = false;
}

// Verify email
async function verifyEmail(email) {
    try {
        verifyButton.disabled = true;
        verificationError.classList.remove('show');

        const response = await fetch('/api/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.message || data.error || 'Verification failed');
            return false;
        }

        if (data.verified) {
            sessionId = data.sessionId;
            clientEmail = email;
            
            // Save session (expires in 24 hours)
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);
            saveSession(sessionId, clientEmail, expiresAt.toISOString());

            showChatScreen();
            return true;
        } else {
            showError(data.message || 'Email verification failed');
            return false;
        }
    } catch (error) {
        console.error('Verification error:', error);
        showError('Network error. Please try again.');
        return false;
    } finally {
        verifyButton.disabled = false;
    }
}

// Send message
async function sendMessage(message) {
    if (!sessionId) {
        showError('Session expired. Please verify again.');
        showVerificationScreen();
        return;
    }

    try {
        showLoading();
        addMessage(message, 'user');

        const response = await fetch('/api/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId,
                message
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 403 && data.error.includes('expired')) {
                clearSession();
                showError('Session expired. Please verify again.');
                showVerificationScreen();
                return;
            }
            throw new Error(data.error || 'Failed to send message');
        }

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
        addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
    } finally {
        hideLoading();
        messageInput.focus();
    }
}

// Event listeners
verificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (email) {
        await verifyEmail(email);
    }
});

messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message && sessionId) {
        messageInput.value = '';
        await sendMessage(message);
    }
});

closeButton.addEventListener('click', () => {
    clearSession();
    showVerificationScreen();
});

// Initialize
if (!loadSession()) {
    showVerificationScreen();
} else {
    showChatScreen();
}

// Auto-focus email input when verification screen is shown
emailInput.addEventListener('focus', () => {
    emailInput.select();
});
