document.addEventListener('DOMContentLoaded', () => {
    const getStartedBtn = document.getElementById('getStartedBtn');
    // Using querySelector to find the class '.nav-links' 
    // This is safer as it matches your current HTML class
    const navLinks = document.querySelector('.nav-links');

    if (getStartedBtn && navLinks) {
        getStartedBtn.addEventListener('click', () => {
            // Toggle the dropdown
            navLinks.classList.toggle('active');
            
            // Change button text for better UX
            if (navLinks.classList.contains('active')) {
                getStartedBtn.textContent = 'Close';
            } else {
                getStartedBtn.textContent = 'Get Started';
            }
        });

        // Professional touch: Close menu when a link is clicked
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                getStartedBtn.textContent = 'Get Started';
            });
        });
    }
});
// Function to display markets on the page
function displayMarkets() {
    const marketList = document.getElementById('market-list');
    if (!marketList) return;

    const markets = getMarkets();
    marketList.innerHTML = ''; // Clear the "Loading" text

    markets.forEach(market => {
        const card = document.createElement('div');
        card.className = 'market-card';
        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 20px;">
                <img src="${market.image}" alt="${market.name}" style="width: 80px; height: 80px; border-radius: 10px; object-fit: cover;">
                <div>
                    <h3 style="color: var(--primary); margin-bottom: 5px;">${market.name}</h3>
                    <p style="font-size: 0.9rem; color: #666;">${market.description}</p>
                </div>
            </div>
            <button class="btn-primary" style="padding: 8px 15px; font-size: 0.8rem;">View Items</button>
        `;
        
        card.onclick = () => {
    // This line removes any spaces or dashes before sending to WhatsApp
    const cleanNumber = market.whatsapp_number.replace(/\D/g, ''); 
    window.open(`https://wa.me/${cleanNumber}?text=Hello, I am interested in ${market.name}`, '_blank');
};

        marketList.appendChild(card);
    });
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    displayMarkets();
});
