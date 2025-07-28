
let currentCard = 1;
const totalCards = 3;

function showCard(cardNumber) {
   
    for(let i = 1; i <= totalCards; i++) {
        document.getElementById('card' + i).style.display = 'none';
    }
    
   
    const dots = document.querySelectorAll('.dot');
    dots.forEach(dot => dot.classList.remove('active-dot'));
    

    document.getElementById('card' + cardNumber).style.display = 'flex';

    dots[cardNumber - 1].classList.add('active-dot');
    
    currentCard = cardNumber;
}

function showNextCard() {
    let nextCard = currentCard + 1;
    if(nextCard > totalCards) {
        nextCard = 1;
    }
    showCard(nextCard);
}

function showPrevCard() {
    let prevCard = currentCard - 1;
    if(prevCard < 1) {
        prevCard = totalCards;
    }
    showCard(prevCard);
}

setInterval(showNextCard, 6000);

// Dialog Box Functions
function showDialog(icon, title, message, buttonText = 'OK', onClose = null) {
    // Create dialog HTML if it doesn't exist
    let dialogOverlay = document.getElementById('dialog-overlay');
    if (!dialogOverlay) {
        dialogOverlay = document.createElement('div');
        dialogOverlay.id = 'dialog-overlay';
        dialogOverlay.className = 'dialog-overlay';
        dialogOverlay.innerHTML = `
            <div class="dialog-box">
                <div class="dialog-icon" id="dialog-icon">${icon}</div>
                <div class="dialog-title" id="dialog-title">${title}</div>
                <div class="dialog-message" id="dialog-message">${message}</div>
                <button class="dialog-button" id="dialog-button" onclick="closeDialog()">${buttonText}</button>
            </div>
        `;
        document.body.appendChild(dialogOverlay);
    } else {
        // Update existing dialog
        document.getElementById('dialog-icon').textContent = icon;
        document.getElementById('dialog-title').textContent = title;
        document.getElementById('dialog-message').textContent = message;
        document.getElementById('dialog-button').textContent = buttonText;
    }

    // Store the onClose callback
    dialogOverlay.onCloseCallback = onClose;

    // Show dialog
    setTimeout(() => {
        dialogOverlay.classList.add('show');
    }, 10);

    // Auto close after 3 seconds if no callback is provided
    if (!onClose) {
        setTimeout(() => {
            closeDialog();
        }, 3000);
    }
}

function closeDialog() {
    const dialogOverlay = document.getElementById('dialog-overlay');
    if (dialogOverlay) {
        dialogOverlay.classList.remove('show');
        
        // Execute callback if provided
        if (dialogOverlay.onCloseCallback) {
            setTimeout(() => {
                dialogOverlay.onCloseCallback();
                dialogOverlay.onCloseCallback = null;
            }, 300);
        }
    }
}

// Success Dialog Functions
function showSuccessDialog(message, onClose = null) {
    showDialog('🎉', 'Success!', message, 'Continue', onClose);
}

function showLoginSuccessDialog(onClose = null) {
    showSuccessDialog('Login successful! Welcome back to LawHub!', onClose);
}

function showSignupSuccessDialog(onClose = null) {
    showSuccessDialog('Account created successfully! You can now explore LawHub!', onClose);
}

// Make functions globally available
window.showDialog = showDialog;
window.closeDialog = closeDialog;
window.showSuccessDialog = showSuccessDialog;
window.showLoginSuccessDialog = showLoginSuccessDialog;
window.showSignupSuccessDialog = showSignupSuccessDialog;

// Loading Button Functions
function setButtonLoading(buttonElement, isLoading = true) {
    if (isLoading) {
        // Store original text
        buttonElement.dataset.originalText = buttonElement.innerHTML;
        
        // Add loading class and spinner
        buttonElement.classList.add('loading');
        buttonElement.innerHTML = `<span class="button-text">${buttonElement.dataset.originalText}</span>`;
        buttonElement.disabled = true;
    } else {
        // Remove loading state
        buttonElement.classList.remove('loading');
        buttonElement.innerHTML = buttonElement.dataset.originalText || buttonElement.innerHTML;
        buttonElement.disabled = false;
    }
}

function setButtonLoadingById(buttonId, isLoading = true) {
    const button = document.getElementById(buttonId);
    if (button) {
        setButtonLoading(button, isLoading);
    }
}

// Make functions globally available
window.setButtonLoading = setButtonLoading;
window.setButtonLoadingById = setButtonLoadingById;

// Contact Form Handler
function handleContactSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const form = event.target;
    const submitButton = document.getElementById('contact-button');
    const name = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const message = form.querySelector('textarea').value;
    
    // Simple validation
    if (!name || !email || !message) {
        showDialog('⚠️', 'Missing Information', 'Please fill in all fields before submitting.', 'OK');
        return;
    }
    
    // Start loading state
    setButtonLoading(submitButton, true);
    
    // Simulate form submission delay (replace with actual API call)
    setTimeout(() => {
        // Stop loading state
        setButtonLoading(submitButton, false);
        
        // Show success dialog
        showDialog('📧', 'Message Sent!', `Thank you ${name}! Your message has been received. We'll get back to you soon at ${email}.`, 'Great!', () => {
            form.reset(); // Clear the form
        });
    }, 1500); // Simulate 1.5 second processing time
}

// Make function globally available
window.handleContactSubmit = handleContactSubmit;

document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if(targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    const discoverButton = document.querySelector('.discover-button');
    discoverButton.addEventListener('click', function() {
        document.querySelector('#about').scrollIntoView({
            behavior: 'smooth'
        });
    });
});
