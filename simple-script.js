
// Navigation scroll behavior - hide nav menu but keep logo
window.addEventListener('scroll', function() {
    const navMenu = document.querySelector('.nav-menu');
    const navButtons = document.querySelector('.nav-buttons');
    const scrollY = window.scrollY;

    if (scrollY > 100) { // Hide navigation after scrolling 100px
        if (navMenu) {
            navMenu.style.opacity = '0';
            navMenu.style.transform = 'translateY(-20px)';
            navMenu.style.pointerEvents = 'none';
        }
        if (navButtons) {
            navButtons.style.opacity = '0';
            navButtons.style.transform = 'translateY(-20px)';
            navButtons.style.pointerEvents = 'none';
        }
    } else { // Show navigation when at top
        if (navMenu) {
            navMenu.style.opacity = '1';
            navMenu.style.transform = 'translateY(0)';
            navMenu.style.pointerEvents = 'auto';
        }
        if (navButtons) {
            navButtons.style.opacity = '1';
            navButtons.style.transform = 'translateY(0)';
            navButtons.style.pointerEvents = 'auto';
        }
    }
});

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

function showDialog(icon, title, message, buttonText = 'OK', onClose = null) {
 
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
        document.getElementById('dialog-icon').textContent = icon;
        document.getElementById('dialog-title').textContent = title;
        document.getElementById('dialog-message').textContent = message;
        document.getElementById('dialog-button').textContent = buttonText;
    }

    dialogOverlay.onCloseCallback = onClose;

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
        
        if (dialogOverlay.onCloseCallback) {
            setTimeout(() => {
                dialogOverlay.onCloseCallback();
                dialogOverlay.onCloseCallback = null;
            }, 300);
        }
    }
}

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

function parseCSV(data) {
    const lines = data.split('\n');
    const header = lines[0].split(',').map(h => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;
        const values = lines[i].split(',');
        const row = {};
        for (let j = 0; j < header.length; j++) {
            if (values[j]) {
                row[header[j]] = values[j].trim();
            }
        }
        rows.push(row);
    }
    return rows;
}

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

    // Fetch and process data for charts
    fetch('crime_dataset_india.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.text();
        })
        .then(data => {
            console.log("CSV data loaded successfully.");
            const parsedData = parseCSV(data);
            
            // Filter for specific serious crimes and major cities
            const targetCrimes = ['HOMICIDE', 'SEXUAL ASSAULT', 'ARSON', 'SUICIDE'];
            const fireAccidentDomain = 'Fire Accident';
            const majorCities = ['Chennai', 'Mumbai', 'Delhi', 'Kolkata', 'Patna'];
            
            const specificCrimeCounts = {};
            const cityWiseCrimes = {};
            const crimeDistribution = {}; // For violin plot data

            parsedData.forEach(row => {
                const crimeDesc = row['Crime Description'];
                const city = row.City;
                const domain = row['Crime Domain'];
                
                // Only process data for major cities
                if (!majorCities.includes(city)) return;
                
                // Count specific serious crimes
                if (targetCrimes.includes(crimeDesc) || domain === fireAccidentDomain) {
                    let crimeCategory = crimeDesc;
                    if (domain === fireAccidentDomain) {
                        crimeCategory = 'FIRE ACCIDENT';
                    }
                    if (crimeDesc === 'SEXUAL ASSAULT') {
                        crimeCategory = 'RAPE/SEXUAL ASSAULT';
                    }
                    
                    specificCrimeCounts[crimeCategory] = (specificCrimeCounts[crimeCategory] || 0) + 1;
                    
                    if (!cityWiseCrimes[city]) {
                        cityWiseCrimes[city] = {};
                    }
                    cityWiseCrimes[city][crimeCategory] = (cityWiseCrimes[city][crimeCategory] || 0) + 1;
                    
                    // Store distribution data for violin plots
                    if (!crimeDistribution[crimeCategory]) {
                        crimeDistribution[crimeCategory] = {};
                    }
                    if (!crimeDistribution[crimeCategory][city]) {
                        crimeDistribution[crimeCategory][city] = [];
                    }
                    crimeDistribution[crimeCategory][city].push({
                        city: city,
                        crimeType: crimeCategory,
                        date: row['Date Reported'],
                        victimAge: parseInt(row['Victim Age']) || 25
                    });
                }
            });

            console.log("Major Cities Crime Counts:", specificCrimeCounts);
            console.log("City-wise Crime Distribution:", cityWiseCrimes);
            console.log("Crime Distribution for Violin:", crimeDistribution);

            // Violin Plot for Crime Distribution across Major Cities
            const swarmCtx = document.getElementById('swarmChart').getContext('2d');
            if (Object.keys(cityWiseCrimes).length > 0) {
                const violinData = [];
                const colors = {
                    'Chennai': 'rgba(220, 38, 127, 0.6)',
                    'Mumbai': 'rgba(239, 68, 68, 0.6)',  
                    'Delhi': 'rgba(251, 146, 60, 0.6)',
                    'Kolkata': 'rgba(168, 85, 247, 0.6)',
                    'Patna': 'rgba(59, 130, 246, 0.6)'
                };
                
                // Create violin-like distribution for each city
                majorCities.forEach((city, cityIndex) => {
                    if (cityWiseCrimes[city]) {
                        Object.entries(cityWiseCrimes[city]).forEach(([crimeType, count]) => {
                            // Create multiple points to simulate violin shape
                            for (let i = 0; i < count; i++) {
                                // Create violin distribution using normal distribution approximation
                                const normalRandom = () => {
                                    let u = 0, v = 0;
                                    while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
                                    while(v === 0) v = Math.random();
                                    const normal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
                                    return normal;
                                };
                                
                                const violinWidth = 0.3;
                                const xOffset = normalRandom() * violinWidth;
                                const yJitter = (Math.random() - 0.5) * 0.2;
                                
                                violinData.push({
                                    x: cityIndex + xOffset,
                                    y: Object.keys(specificCrimeCounts).indexOf(crimeType) + yJitter,
                                    city: city,
                                    crimeType: crimeType,
                                    pointBackgroundColor: colors[city] || 'rgba(245, 232, 211, 0.6)'
                                });
                            }
                        });
                    }
                });

                new Chart(swarmCtx, {
                    type: 'scatter',
                    data: {
                        datasets: [{
                            label: 'Crime Distribution',
                            data: violinData,
                            backgroundColor: violinData.map(point => point.pointBackgroundColor),
                            borderColor: 'rgba(0, 0, 0, 0.4)',
                            borderWidth: 1,
                            pointRadius: 4,
                            pointHoverRadius: 7
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Serious Crimes Distribution - Major Cities (Violin Plot)',
                                color: 'rgba(245, 232, 211, 1)',
                                font: { size: 16, weight: 'bold' }
                            },
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const point = violinData[context.dataIndex];
                                        return `${point.crimeType} in ${point.city}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                type: 'linear',
                                position: 'bottom',
                                min: -0.7,
                                max: majorCities.length - 0.3,
                                ticks: {
                                    callback: function(value) {
                                        const cityIndex = Math.round(value);
                                        return majorCities[cityIndex] || '';
                                    },
                                    color: 'rgba(245, 232, 211, 1)',
                                    stepSize: 1
                                },
                                grid: {
                                    color: 'rgba(245, 232, 211, 0.3)'
                                },
                                title: {
                                    display: true,
                                    text: 'Major Cities',
                                    color: 'rgba(245, 232, 211, 1)',
                                    font: { size: 14, weight: 'bold' }
                                }
                            },
                            y: {
                                min: -0.5,
                                max: Object.keys(specificCrimeCounts).length - 0.5,
                                ticks: {
                                    callback: function(value) {
                                        const crimeTypes = Object.keys(specificCrimeCounts);
                                        return crimeTypes[Math.round(value)] || '';
                                    },
                                    color: 'rgba(245, 232, 211, 1)',
                                    stepSize: 1
                                },
                                grid: {
                                    color: 'rgba(245, 232, 211, 0.3)'
                                },
                                title: {
                                    display: true,
                                    text: 'Crime Types',
                                    color: 'rgba(245, 232, 211, 1)',
                                    font: { size: 14, weight: 'bold' }
                                }
                            }
                        }
                    }
                });
            } else {
                console.error("No data available for the swarm chart.");
            }

            // Bar Chart for Crime Frequency Analysis
            const boxCtx = document.getElementById('boxChart').getContext('2d');
            if (Object.keys(specificCrimeCounts).length > 0) {
                const domains = Object.keys(specificCrimeCounts);
                const counts = Object.values(specificCrimeCounts);
                
                const crimeColors = [
                    'rgba(220, 38, 127, 0.8)', // Pink for Rape/Sexual Assault
                    'rgba(239, 68, 68, 0.8)',  // Red for Homicide  
                    'rgba(251, 146, 60, 0.8)', // Orange for Fire Accident
                    'rgba(168, 85, 247, 0.8)', // Purple for Arson
                    'rgba(59, 130, 246, 0.8)'  // Blue for Suicide
                ];

                new Chart(boxCtx, {
                    type: 'bar',
                    data: {
                        labels: domains,
                        datasets: [{
                            label: 'Number of Cases',
                            data: counts,
                            backgroundColor: crimeColors.slice(0, domains.length),
                            borderColor: crimeColors.slice(0, domains.length).map(color => color.replace('0.8)', '1)')),
                            borderWidth: 2,
                            borderRadius: 8,
                            borderSkipped: false
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Serious Crime Frequency - Major Cities (Bar Chart)',
                                color: 'rgba(245, 232, 211, 1)',
                                font: { size: 16, weight: 'bold' }
                            },
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${context.label}: ${context.parsed.y} cases`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                ticks: {
                                    color: 'rgba(245, 232, 211, 1)',
                                    font: { size: 12 },
                                    maxRotation: 45
                                },
                                grid: {
                                    color: 'rgba(245, 232, 211, 0.3)'
                                },
                                title: {
                                    display: true,
                                    text: 'Crime Categories',
                                    color: 'rgba(245, 232, 211, 1)',
                                    font: { size: 14, weight: 'bold' }
                                }
                            },
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    color: 'rgba(245, 232, 211, 1)',
                                    stepSize: 1
                                },
                                grid: {
                                    color: 'rgba(245, 232, 211, 0.3)'
                                },
                                title: {
                                    display: true,
                                    text: 'Number of Cases',
                                    color: 'rgba(245, 232, 211, 1)',
                                    font: { size: 14, weight: 'bold' }
                                }
                            }
                        }
                    }
                });
            } else {
                console.error("No data available for the box chart.");
            }
        })
        .catch(error => {
            console.error('Error fetching or parsing CSV data:', error);
        });
});
