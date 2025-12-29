// 1. Alert errors on iPhone
window.onerror = function(msg) { alert(msg); };

document.addEventListener('DOMContentLoaded', () => {
    // 2. Button logic first (So it works immediately!)
    const btn = document.getElementById('getStartedBtn');
    const links = document.querySelector('.nav-links');

    if (btn && links) {
        btn.onclick = () => {
            links.classList.toggle('active');
            btn.textContent = links.classList.contains('active') ? 'Close' : 'Get Started';
        };
    }

    // 3. Load database data
    if (typeof fetchMarketsFromSupabase === 'function') {
        renderMarkets();
    }
});

async function renderMarkets() {
    const list = document.getElementById('market-list');
    try {
        const data = await fetchMarketsFromSupabase();
        if (!data || data.length === 0) {
            list.innerHTML = "<p>Add a row in Supabase!</p>";
            return;
        }
        
        list.innerHTML = ""; // Clear the loading text
        
        data.forEach(m => {
            const div = document.createElement('div');
            div.className = 'market-card';
            
            // This is the HTML for the card
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px; width:100%;">
                    <img src="${m.image_url}" style="width:70px; height:70px; border-radius:12px; object-fit:cover;">
                    <div style="flex:1;">
                        <h4 style="color:var(--primary); margin-bottom:4px;">${m.name}</h4>
                        <p style="font-size:0.8rem; color:#666; line-height:1.3;">${m.description}</p>
                    </div>
                </div>
            `;

            // ui.js - Updated Click Logic
div.onclick = async () => {
    // 1. Clear the screen or show a loading state
    list.innerHTML = "<h3>Loading items...</h3>";
    
    // 2. Fetch the items for this specific market
    const items = await fetchItemsByMarket(m.id);
    
    // 3. Render the items
    list.innerHTML = `<button onclick="location.reload()" class="btn-primary" style="margin-bottom:20px;">← Back to Markets</button>`;
    
    if (items.length === 0) {
        list.innerHTML += "<p>No items found in this market yet.</p>";
        return;
    }

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'market-card'; // Reuse the same styling!
        itemDiv.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px; width:100%;">
                <img src="${item.image_url}" style="width:60px; height:60px; border-radius:8px; object-fit:cover;">
                <div style="flex:1;">
                    <h4 style="color:var(--primary);">${item.name}</h4>
                    <p style="font-weight:bold;">${item.price}</p>
                </div>
            </div>
            <button class="btn-primary" style="padding:5px 10px; font-size:0.7rem;">Order</button>
        `;
        
        itemDiv.onclick = (e) => {
            e.stopPropagation(); // Stop it from reloading the market
            const message = encodeURIComponent(`I'd like to order: ${item.name} from ${m.name}`);
            window.open(`https://wa.me/${m.whatsapp_number.replace(/\D/g, '')}?text=${message}`);
        };
        
        list.appendChild(itemDiv);
    });
};
    } catch (e) {
        list.innerHTML = "<p>Database connection failed.</p>";
    }
}
