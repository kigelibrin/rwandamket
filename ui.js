// ui.js - Safety Version
document.addEventListener('DOMContentLoaded', () => {
    console.log("UI Brain Initialized");

    // 1. FIX THE BUTTON IMMEDIATELY
    const getStartedBtn = document.getElementById('getStartedBtn');
    const navLinks = document.querySelector('.nav-links');

    if (getStartedBtn && navLinks) {
        getStartedBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            getStartedBtn.textContent = navLinks.classList.contains('active') ? 'Close' : 'Get Started';
        });
    }

    // 2. LOAD MARKETS IN THE BACKGROUND
    loadMarkets();
});

async function loadMarkets() {
    const marketList = document.getElementById('market-list');
    if (!marketList) return;

    try {
        // This calls the function in api.js
        const markets = await fetchMarketsFromSupabase();
        
        if (!markets || markets.length === 0) {
            marketList.innerHTML = '<p style="text-align:center; padding:20px;">No markets found in database. Add a row in Supabase!</p>';
            return;
        }

        marketList.innerHTML = ''; // Remove the "Loading..." text
        
        markets.forEach(market => {
            const card = document.createElement('div');
            card.className = 'market-card';
            card.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px;">
                    <img src="${market.image_url}" style="width:60px; height:60px; border-radius:8px; object-fit:cover;">
                    <div>
                        <h4 style="color:var(--primary);">${market.name}</h4>
                        <p style="font-size:0.8rem; color:#666;">${market.description}</p>
                    </div>
                </div>
            `;
            marketList.appendChild(card);
        });
    } catch (error) {
        console.error("Failed to load markets:", error);
        marketList.innerHTML = '<p style="color:red; text-align:center;">Error connecting to database.</p>';
    }
}
