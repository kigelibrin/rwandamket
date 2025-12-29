document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Load
    renderMarkets();

    // 2. Mobile Menu Toggle
    const btn = document.getElementById('getStartedBtn');
    const links = document.querySelector('.nav-links');
    if (btn && links) {
        btn.onclick = () => {
            links.classList.toggle('active');
            btn.textContent = links.classList.contains('active') ? 'Close' : 'Get Started';
        };
    }
});

// --- FUNCTION 1: RENDER ALL MARKETS ---
async function renderMarkets() {
    const list = document.getElementById('market-list');
    list.innerHTML = "<p style='text-align:center;'>Loading Markets...</p>";

    try {
        const { data: markets, error } = await _supabase.from('markets').select('*');
        if (error) throw error;

        list.innerHTML = ""; // Clear loading text
        markets.forEach(m => {
            const card = document.createElement('div');
            card.className = 'market-card';
            card.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px;">
                   
<img src="${m.image_url}" style="width:70px; height:70px; border-radius:12px; object-fit:cover;">
                    <div>
                        <h4 style="color:var(--primary);">${m.name}</h4>
                        <p style="font-size:0.8rem; color:#666;">${m.description}</p>
                    </div>
                </div>
            `;
            // Click to see items
            card.onclick = () => renderItems(m.id, m.name, m.whatsapp_number);
            list.appendChild(card);
        });
    } catch (e) {
        list.innerHTML = "<p>Error loading markets.</p>";
    }
}

// --- FUNCTION 2: RENDER ITEMS FOR A SPECIFIC MARKET ---
async function renderItems(marketId, marketName, whatsapp) {
    const list = document.getElementById('market-list');
    list.innerHTML = "<p style='text-align:center;'>Fetching products...</p>";

    try {
        const { data: items, error } = await _supabase
            .from('items')
            .select('*')
            .eq('market_id', marketId);

        if (error) throw error;

        // Header with Back Button
        list.innerHTML = `
            <div style="margin-bottom:20px; display:flex; align-items:center; gap:10px;">
                <button onclick="renderMarkets()" style="background:none; border:none; color:var(--primary); font-weight:bold; cursor:pointer;">← Back</button>
                <h3 style="margin:0;">${marketName}</h3>
            </div>
        `;

        if (items.length === 0) {
            list.innerHTML += "<p style='text-align:center; padding:20px;'>Coming soon! No items yet.</p>";
            return;
        }

        items.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'market-card';
            itemCard.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px; width:100%;">
                    <img 
    src="${item.image_url}" 
    onerror="this.src='https://via.placeholder.com/150?text=Image+Coming+Soon'" 
    style="width:70px; height:70px; border-radius:12px; object-fit:cover; background-color:#eee;"
>
                    <div style="flex:1;">
                        <h4 style="margin:0;">${item.name}</h4>
                        <span class="price-tag">${item.price}</span>
                    </div>
                    <button class="btn-primary" style="padding:8px 12px; font-size:0.7rem;">Order</button>
                </div>
            `;
            
            itemCard.onclick = () => {
                const msg = encodeURIComponent(`Hello! I want to order ${item.name} from the ${marketName} category.`);
                window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank');
            };
            
            list.appendChild(itemCard);
        });
    } catch (e) {
        list.innerHTML = "<p>Error loading items.</p>";
    }
}
