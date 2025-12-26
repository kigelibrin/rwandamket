document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. THE BUTTON LOGIC (Should work immediately) ---
    const getStartedBtn = document.getElementById('getStartedBtn');
    const navLinks = document.querySelector('.nav-links');

    if (getStartedBtn && navLinks) {
        getStartedBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            getStartedBtn.textContent = navLinks.classList.contains('active') ? 'Close' : 'Get Started';
        });
    }

    // --- 2. THE MARKET LOGIC (Runs in the background) ---
    await displayMarkets();
});

async function displayMarkets() {
    const marketList = document.getElementById('market-list');
    if (!marketList) return;

    try {
        const markets = await fetchMarketsFromSupabase();
        marketList.innerHTML = ''; 

        if (!markets || markets.length === 0) {
            marketList.innerHTML = '<p>No markets found in database.</p>';
            return;
        }

        markets.forEach(market => {
            const card = document.createElement('div');
            card.className = 'market-card';
            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 20px;">
                    <img src="${market.image_url}" alt="${market.name}" style="width: 80px; height: 80px; border-radius: 10px; object-fit: cover;">
                    <div>
                        <h3 style="color: var(--primary);">${market.name}</h3>
                        <p style="font-size: 0.85rem; color: #666;">${market.description}</p>
                    </div>
                </div>
                <button class="btn-primary" style="padding: 5px 12px; font-size: 0.75rem;">View</button>
            `;
            card.onclick = () => {
                const cleanNum = market.whatsapp_number.replace(/\D/g, '');
                window.open(`https://wa.me/${cleanNum}?text=Inquiry about ${market.name}`, '_blank');
            };
            marketList.appendChild(card);
        });
    } catch (e) {
        console.error("UI Error:", e);
        marketList.innerHTML = '<p>Error connecting to database.</p>';
    }
}
