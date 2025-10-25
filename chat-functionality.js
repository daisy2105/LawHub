// Real-time Chat Functionality with Request-Accept Flow
// This file handles the complete chat workflow

// ALWAYS use deployed Render server (not localhost)
const CHAT_API_BASE = 'https://lawhub-1.onrender.com/api/chat';

let currentConnection = null;
let currentLawyer = null;
let messagePollingInterval = null;
let connections = [];

console.log('🔗 Chat API Base URL:', CHAT_API_BASE);

// Get auth token
function getAuthToken() {
    return localStorage.getItem('token') || localStorage.getItem('lawhub_token');
}

// 1. Send connection request to lawyer
async function sendConnectionRequest(lawyerId, lawyerName) {
    try {
        const token = getAuthToken();
        if (!token) {
            alert('Please login first');
            window.location.href = 'login2.html';
            return;
        }

        const response = await fetch(`${CHAT_API_BASE}/request-connection`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                lawyerId: lawyerId,
                message: `Hi, I would like to connect with you regarding legal consultation.`
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Connection Request Sent!', `Your request has been sent to ${lawyerName}. You'll be notified when they accept.`, 'success');
            
            // Update chat badge after sending request
            if (typeof updateChatBadge === 'function') {
                await updateChatBadge();
            }
        } else {
            if (data.status === 'pending') {
                showNotification('⏳ Request Pending', `You already have a pending request with ${lawyerName}.`, 'info');
            } else if (data.status === 'accepted') {
                showNotification('✅ Already Connected', `You're already connected with ${lawyerName}!`, 'success');
                loadActiveConnections();
            } else {
                showNotification('❌ Error', data.error || 'Failed to send connection request', 'error');
            }
        }
    } catch (error) {
        console.error('Connection request error:', error);
        showNotification('❌ Error', 'Failed to send connection request. Please try again.', 'error');
    }
}

// 2. Load active connections (accepted chats)
async function loadActiveConnections() {
    try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`${CHAT_API_BASE}/connections`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            connections = data.connections;
            displayActiveConnections();
            
            // Update chat badge after loading connections
            if (typeof updateChatBadge === 'function') {
                await updateChatBadge();
            }
        }
    } catch (error) {
        console.error('Load connections error:', error);
    }
}

// 3. Display active connections in UI
function displayActiveConnections() {
    const lawyerGrid = document.querySelector('.lawyer-grid');
    if (!lawyerGrid) return;

    if (connections.length === 0) {
        lawyerGrid.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #888;">
                <i class="fas fa-comments" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                <p>No active chats yet</p>
                <p style="font-size: 12px; margin-top: 8px;">Send a connection request to start chatting!</p>
            </div>
        `;
        return;
    }

    const defaultAvatar = 'data:image/png;base64,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';

    lawyerGrid.innerHTML = connections.map(conn => `
        <div class="lawyer-card" onclick="openChatWith('${conn.connectionId}', '${conn.otherUserName}', '${conn.otherUserAvatar || defaultAvatar}')">
            <div class="lawyer-avatar">
                <img src="${conn.otherUserAvatar || defaultAvatar}" alt="${conn.otherUserName}" 
                     onerror="this.src='${defaultAvatar}'">
            </div>
            <div class="lawyer-info">
                <h4>${conn.otherUserName}</h4>
                <p style="color: #556b2f; font-weight: 600; font-size: 13px; margin: 2px 0;">
                    💬 Click to chat
                </p>
            </div>
            <div class="status-indicator online"></div>
        </div>
    `).join('');
}

// 4. Open chat conversation
async function openChatWith(connectionId, lawyerName, lawyerAvatar) {
    currentConnection = connectionId;
    currentLawyer = lawyerName;

    // Update chat header
    document.getElementById('chatLawyerName').textContent = lawyerName;
    document.getElementById('chatLawyerAvatar').src = lawyerAvatar;

    // Switch to conversation view
    document.getElementById('lawyerSelection').style.display = 'none';
    document.getElementById('chatConversation').classList.add('active');

    // Load message history
    await loadMessages();

    // Start polling for new messages
    startMessagePolling();
}

// 5. Load message history
async function loadMessages() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${CHAT_API_BASE}/messages/${currentConnection}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayMessages(data.messages);
        }
    } catch (error) {
        console.error('Load messages error:', error);
    }
}

// 6. Display messages in chat
function displayMessages(messages) {
    const chatMessages = document.getElementById('chatMessages');
    
    if (messages.length === 0) {
        chatMessages.innerHTML = `
            <div class="message received">
                <div class="message-bubble">
                    Hello! How can I help you today?
                </div>
            </div>
        `;
        return;
    }

    chatMessages.innerHTML = messages.map(msg => `
        <div class="message ${msg.isMine ? 'sent' : 'received'}">
            <div class="message-bubble">
                ${escapeHtml(msg.message)}
                <div class="message-time">${formatTime(msg.sentAt)}</div>
            </div>
        </div>
    `).join('');

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 7. Send message
async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();

    if (!message || !currentConnection) return;

    try {
        const token = getAuthToken();
        const response = await fetch(`${CHAT_API_BASE}/send-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                connectionId: currentConnection,
                message: message
            })
        });

        if (response.ok) {
            chatInput.value = '';
            // Reload messages to show the new one
            await loadMessages();
        } else {
            const data = await response.json();
            alert('Error sending message: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Send message error:', error);
        alert('Failed to send message. Please try again.');
    }
}

// 8. Poll for new messages (real-time simulation)
function startMessagePolling() {
    // Clear any existing interval
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
    }

    // Poll every 2 seconds
    messagePollingInterval = setInterval(async () => {
        if (currentConnection) {
            await loadMessages();
        }
    }, 2000);
}

// 9. Stop message polling
function stopMessagePolling() {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
        messagePollingInterval = null;
    }
}

// 10. Back to lawyer selection
function backToLawyerSelection() {
    stopMessagePolling();
    currentConnection = null;
    currentLawyer = null;
    
    document.getElementById('lawyerSelection').style.display = 'block';
    document.getElementById('chatConversation').classList.remove('active');
}

// 11. Handle Enter key in chat input
function handleChatEnter(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Utility functions
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showNotification(title, message, type = 'info') {
    // You can use a toast library or custom notification
    alert(`${title}\n\n${message}`);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load active connections only when chat modal is opened (not automatically)
    // Removed auto-refresh to prevent repetitive server calls
});

// Export functions for global access
window.sendConnectionRequest = sendConnectionRequest;
window.loadActiveConnections = loadActiveConnections;
window.openChatWith = openChatWith;
window.sendMessage = sendMessage;
window.backToLawyerSelection = backToLawyerSelection;
window.handleChatEnter = handleChatEnter;
