/**
 * Complete Chat System with Expert Notifications
 * Implements: Red badge, request inbox, accept/reject, delete chat, encrypted messages
 * Your idea: "Red button on chat icon for experts to get notifications about messages/requests"
 */

// Auto-detect environment
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const CHAT_API_BASE = isLocalhost ? 'http://localhost:3000/api/chat' : 'https://lawhub-1.onrender.com/api/chat';

console.log('💬 Enhanced Chat API:', CHAT_API_BASE);

// State
let currentConnection = null;
let messagePollingInterval = null;
let notificationPollingInterval = null;
let connections = [];
let pendingRequests = [];

// Get authentication token
function getAuthToken() {
    return localStorage.getItem('token') || localStorage.getItem('lawhub_token');
}

// Get current user ID from token
function getCurrentUserId() {
    const token = getAuthToken();
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
    } catch (error) {
        console.error('Error parsing token:', error);
        return null;
    }
}

/**
 * STEP 1: Send connection request (User → Expert)
 */
async function sendConnectionRequest(lawyerId, lawyerName) {
    try {
        const token = getAuthToken();
        if (!token) {
            alert('Please login first');
            window.location.href = 'login2.html';
            return;
        }

        console.log('📨 Sending request to:', lawyerId);

        const response = await fetch(`${CHAT_API_BASE}/request-connection`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                lawyerId: lawyerId,
                message: `Hi ${lawyerName}, I would like to connect with you for legal consultation.`
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showNotification('✅ Request Sent!', `Your connection request has been sent to ${lawyerName}. They'll be notified!`, 'success');
        } else {
            if (data.status === 'pending') {
                showNotification('⏳ Already Pending', `You already have a pending request with ${lawyerName}.`, 'info');
            } else if (data.status === 'accepted') {
                showNotification('✅ Already Connected', `You're already connected with ${lawyerName}!`, 'success');
                loadActiveConnections();
            } else {
                showNotification('❌ Error', data.message || 'Failed to send request', 'error');
            }
        }
    } catch (error) {
        console.error('Connection request error:', error);
        showNotification('❌ Error', 'Failed to send connection request. Please try again.', 'error');
    }
}

/**
 * STEP 2: Load pending requests (Expert view - YOUR RED BADGE IDEA!)
 */
async function loadPendingRequests() {
    try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`${CHAT_API_BASE}/pending-requests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                pendingRequests = data.requests || [];
                displayPendingRequests();
                console.log(`📋 ${pendingRequests.length} pending requests`);
            }
        }
    } catch (error) {
        console.error('Load pending requests error:', error);
    }
}

/**
 * STEP 3: Display pending requests (Expert inbox)
 */
function displayPendingRequests() {
    const container = document.getElementById('pendingRequestsContainer');
    if (!container) return;

    if (pendingRequests.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #888;">
                <i class="fas fa-inbox" style="font-size: 48px; opacity: 0.3; margin-bottom: 16px;"></i>
                <p>No pending requests</p>
            </div>
        `;
        return;
    }

    container.innerHTML = pendingRequests.map(request => `
        <div class="request-card">
            <div class="request-header">
                <img src="${getDefaultAvatar()}" alt="User" class="request-avatar">
                <div class="request-info">
                    <h4>User ${request.userId.substring(0, 8)}...</h4>
                    <p class="request-time">${formatTimeAgo(request.createdAt)}</p>
                </div>
            </div>
            ${request.requestMessage ? `
                <div class="request-message">
                    <i class="fas fa-quote-left"></i>
                    ${escapeHtml(request.requestMessage)}
                </div>
            ` : ''}
            <div class="request-actions">
                <button class="btn-accept" onclick="respondToRequest('${request._id}', 'accepted')">
                    <i class="fas fa-check"></i> Accept
                </button>
                <button class="btn-reject" onclick="respondToRequest('${request._id}', 'rejected')">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * STEP 4: Respond to request (Accept/Reject)
 */
async function respondToRequest(connectionId, action) {
    try {
        const token = getAuthToken();
        if (!token) return;

        console.log(`🔄 ${action} request ${connectionId}`);

        const response = await fetch(`${CHAT_API_BASE}/respond-request/${connectionId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ action })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showNotification(
                action === 'accepted' ? '✅ Request Accepted!' : '❌ Request Rejected',
                action === 'accepted' 
                    ? 'You can now chat with this user!' 
                    : 'Request has been rejected.',
                action === 'accepted' ? 'success' : 'info'
            );

            // Refresh lists
            loadPendingRequests();
            if (action === 'accepted') {
                loadActiveConnections();
                switchToChatTab(); // Auto-switch to chats tab
            }
        } else {
            showNotification('❌ Error', data.message || 'Failed to respond', 'error');
        }
    } catch (error) {
        console.error('Respond to request error:', error);
        showNotification('❌ Error', 'Failed to respond. Please try again.', 'error');
    }
}

/**
 * STEP 5: Load active connections
 */
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
            if (data.success) {
                connections = data.connections || [];
                displayActiveConnections();
                console.log(`💬 ${connections.length} active chats`);
            }
        }
    } catch (error) {
        console.error('Load connections error:', error);
    }
}

/**
 * STEP 6: Display active connections
 */
function displayActiveConnections() {
    const container = document.getElementById('activeChatsContainer');
    if (!container) return;

    const currentUserId = getCurrentUserId();

    if (connections.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #888;">
                <i class="fas fa-comments" style="font-size: 48px; opacity: 0.3; margin-bottom: 16px;"></i>
                <p>No active chats yet</p>
                <p style="font-size: 12px; margin-top: 8px;">Accept a request to start chatting!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = connections.map(conn => {
        const otherUserId = conn.userId === currentUserId ? conn.lawyerId : conn.userId;
        return `
            <div class="chat-card">
                <div class="chat-header" onclick="openChatWith('${conn._id}', '${otherUserId}')">
                    <img src="${getDefaultAvatar()}" alt="User" class="chat-avatar">
                    <div class="chat-info">
                        <h4>User ${otherUserId.substring(0, 12)}...</h4>
                        <p class="chat-preview">Click to open chat</p>
                    </div>
                </div>
                <button class="btn-delete-chat" onclick="event.stopPropagation(); deleteChat('${conn._id}')" title="Delete chat">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
}

/**
 * STEP 7: Open chat conversation
 */
async function openChatWith(connectionId, otherUserId) {
    currentConnection = connectionId;

    // Update chat header
    document.getElementById('chatUserName').textContent = `User ${otherUserId.substring(0, 12)}...`;
    document.getElementById('chatUserAvatar').src = getDefaultAvatar();

    // Switch views
    document.getElementById('chatListView').style.display = 'none';
    document.getElementById('chatMessagesView').style.display = 'flex';

    // Load messages
    await loadMessages();

    // Mark as read
    markMessagesAsRead(connectionId);

    // Start polling
    startMessagePolling();
}

/**
 * STEP 8: Load messages (decrypted from MongoDB)
 */
async function loadMessages() {
    if (!currentConnection) return;

    try {
        const token = getAuthToken();
        const response = await fetch(`${CHAT_API_BASE}/messages/${currentConnection}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayMessages(data.messages);
            }
        }
    } catch (error) {
        console.error('Load messages error:', error);
    }
}

/**
 * STEP 9: Display messages
 */
function displayMessages(messages) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const currentUserId = getCurrentUserId();

    if (messages.length === 0) {
        chatMessages.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-comment-dots"></i>
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }

    chatMessages.innerHTML = messages.map(msg => {
        const isMine = msg.senderId === currentUserId;
        return `
            <div class="message ${isMine ? 'sent' : 'received'}">
                <div class="message-bubble">
                    ${escapeHtml(msg.message)}
                    <div class="message-time">${formatTime(msg.createdAt)}</div>
                </div>
            </div>
        `;
    }).join('');

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * STEP 10: Send message
 */
async function sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;

    const message = input.value.trim();
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
            input.value = '';
            await loadMessages();
        } else {
            const data = await response.json();
            alert('Failed to send message: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Send message error:', error);
        alert('Failed to send message. Please try again.');
    }
}

/**
 * STEP 11: Delete chat (YOUR IDEA!)
 */
async function deleteChat(connectionId) {
    if (!confirm('Delete this chat? All messages will be permanently removed.')) {
        return;
    }

    try {
        const token = getAuthToken();
        const response = await fetch(`${CHAT_API_BASE}/delete-connection/${connectionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showNotification('✅ Deleted', 'Chat has been deleted', 'success');

            // Close if currently open
            if (currentConnection === connectionId) {
                backToChatList();
            }

            // Refresh list
            loadActiveConnections();
        } else {
            showNotification('❌ Error', data.message || 'Failed to delete', 'error');
        }
    } catch (error) {
        console.error('Delete chat error:', error);
        showNotification('❌ Error', 'Failed to delete. Please try again.', 'error');
    }
}

/**
 * STEP 12: Update notification badge (RED BUTTON - YOUR IDEA!)
 */
async function updateNotificationBadge() {
    try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`${CHAT_API_BASE}/unread-count`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                const badge = document.getElementById('chatNotificationBadge');
                if (badge) {
                    if (data.totalCount > 0) {
                        badge.textContent = data.totalCount;
                        badge.style.display = 'flex';
                        badge.classList.add('pulse'); // Add animation
                    } else {
                        badge.style.display = 'none';
                        badge.classList.remove('pulse');
                    }
                }

                console.log(`🔴 Badge: ${data.totalCount} (${data.unreadCount} messages + ${data.pendingRequests} requests)`);
            }
        }
    } catch (error) {
        console.error('Update badge error:', error);
    }
}

/**
 * Mark messages as read
 */
async function markMessagesAsRead(connectionId) {
    try {
        const token = getAuthToken();
        await fetch(`${CHAT_API_BASE}/mark-read/${connectionId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Update badge after marking as read
        updateNotificationBadge();
    } catch (error) {
        console.error('Mark as read error:', error);
    }
}

// Message polling
function startMessagePolling() {
    stopMessagePolling();
    messagePollingInterval = setInterval(() => {
        if (currentConnection) {
            loadMessages();
        }
    }, 2000);
}

function stopMessagePolling() {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
        messagePollingInterval = null;
    }
}

// Notification polling (RED BADGE)
function startNotificationPolling() {
    updateNotificationBadge(); // Immediate update
    notificationPollingInterval = setInterval(() => {
        updateNotificationBadge();
    }, 10000); // Every 10 seconds
}

function stopNotificationPolling() {
    if (notificationPollingInterval) {
        clearInterval(notificationPollingInterval);
        notificationPollingInterval = null;
    }
}

// UI Navigation
function switchToRequestsTab() {
    document.getElementById('requestsTab').classList.add('active');
    document.getElementById('chatsTab').classList.remove('active');
    document.getElementById('pendingRequestsContainer').style.display = 'block';
    document.getElementById('activeChatsContainer').style.display = 'none';
    loadPendingRequests();
}

function switchToChatTab() {
    document.getElementById('chatsTab').classList.add('active');
    document.getElementById('requestsTab').classList.remove('active');
    document.getElementById('activeChatsContainer').style.display = 'block';
    document.getElementById('pendingRequestsContainer').style.display = 'none';
    loadActiveConnections();
}

function backToChatList() {
    stopMessagePolling();
    currentConnection = null;
    document.getElementById('chatMessagesView').style.display = 'none';
    document.getElementById('chatListView').style.display = 'flex';
}

// Handle Enter key
function handleChatEnter(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Utility functions
function getDefaultAvatar() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iIzRBNTU2OCIvPjxwYXRoIGQ9Ik0yMCAyMkM5IDIyIDkgMjggOSAyOEgzMVYyOEMzMSAyOCAzMSAyMiAyMCAyMloiIGZpbGw9IiNGRkYiLz48Y2lyY2xlIGN4PSIyMCIgY3k9IjE0IiByPSI2IiBmaWxsPSIjRkZGIi8+PC9zdmc+';
}

function formatTimeAgo(date) {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

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

function showNotification(title, message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    
    // Try to use existing notification system
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        alert(`${title}\n\n${message}`);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    startNotificationPolling();
    loadActiveConnections();
    loadPendingRequests();
});

// Cleanup
window.addEventListener('beforeunload', () => {
    stopMessagePolling();
    stopNotificationPolling();
});

// Export functions
window.sendConnectionRequest = sendConnectionRequest;
window.respondToRequest = respondToRequest;
window.loadPendingRequests = loadPendingRequests;
window.loadActiveConnections = loadActiveConnections;
window.openChatWith = openChatWith;
window.sendMessage = sendMessage;
window.deleteChat = deleteChat;
window.backToChatList = backToChatList;
window.switchToRequestsTab = switchToRequestsTab;
window.switchToChatTab = switchToChatTab;
window.handleChatEnter = handleChatEnter;
window.updateNotificationBadge = updateNotificationBadge;

console.log('✅ Enhanced chat system loaded with expert notifications!');