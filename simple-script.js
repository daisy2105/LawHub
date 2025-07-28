
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
