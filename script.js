document.addEventListener('DOMContentLoaded', () => {
    // Scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.content-section, .contact-form').forEach(section => {
        observer.observe(section);
    });

    // Enhanced Carousel functionality
    let currentSlide = 0;
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtns = document.querySelectorAll('.prev-btn');
    const nextBtns = document.querySelectorAll('.next-btn');

    function showSlide(n) {
        // Remove all classes
        slides.forEach(slide => {
            slide.classList.remove('active', 'prev');
        });
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Handle slide boundaries
        if (n >= slides.length) currentSlide = 0;
        if (n < 0) currentSlide = slides.length - 1;
        
        // Set current slide as active
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
        
        // Set previous slide for smooth transition
        const prevSlide = currentSlide - 1 < 0 ? slides.length - 1 : currentSlide - 1;
        slides[prevSlide].classList.add('prev');
    }

    function nextSlide() {
        currentSlide++;
        showSlide(currentSlide);
    }

    function prevSlide() {
        currentSlide--;
        showSlide(currentSlide);
    }

    // Event listeners for all navigation buttons
    nextBtns.forEach(btn => {
        btn.addEventListener('click', nextSlide);
    });

    prevBtns.forEach(btn => {
        btn.addEventListener('click', prevSlide);
    });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
        });
    });

    // Auto-slide every 6 seconds
    setInterval(nextSlide, 6000);
});
