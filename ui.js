// ui.js - Update the displayMarkets function
async function displayMarkets() {
    const marketList = document.getElementById('market-list');
    if (!marketList) return;

    // We use 'await' now because we are waiting for the internet to talk to Supabase
    const markets = await fetchMarketsFromSupabase();
    
    marketList.innerHTML = ''; 

    if (markets.length === 0) {
        marketList.innerHTML = '<p>No markets found. Add some in Supabase!</p>';
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
                    <p style="font-size: 0.9rem; color: #666;">${market.description}</p>
                </div>
            </div>
            <button class="btn-primary">View</button>
        `;

        card.onclick = () => {
            window.open(`https://wa.me/${market.whatsapp_number}?text=I'm interested in ${market.name}`, '_blank');
        };

        marketList.appendChild(card);
    });
}
