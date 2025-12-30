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
// Inside document.addEventListener('DOMContentLoaded', () => { ... })

const searchInput = document.getElementById('marketSearch');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.market-card');
        
        cards.forEach(card => {
            const text = card.innerText.toLowerCase();
            // If the search term is in the card text, show it; otherwise, hide it
            card.style.display = text.includes(term) ? 'flex' : 'none';
        });
    });
}
// 1. Move the filtering into its own function so we can call it anytime
function filterMarkets() {
    const activeChip = document.querySelector('.filter-chip.active');
    if (!activeChip) return;

    const selectedCategory = activeChip.getAttribute('data-category').toLowerCase();
    const cards = document.querySelectorAll('.market-card');

    cards.forEach(card => {
        // Get the category tag we set in renderMarkets
        const cardCategory = (card.getAttribute('data-cat') || "").toLowerCase();

        if (selectedCategory === 'all' || cardCategory === selectedCategory) {
            card.style.display = 'flex'; // Show it
        } else {
            card.style.display = 'none'; // Hide it
        }
    });
}

// 2. Update your Chip Click logic
document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.onclick = function() {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        filterMarkets(); // Run the filter immediately
    };
});


// --- FUNCTION 1: RENDER ALL MARKETS ---
async function renderMarkets() {
    const list = document.getElementById('market-list');
    try {
        const { data: markets, error } = await _supabase.from('markets').select('*');
        if (error) throw error;

        list.innerHTML = ""; 
        markets.forEach(m => {
            const card = document.createElement('div');
            card.className = 'market-card';
            
            // --- THIS IS THE KEY LINE ---
            // It takes the 'Food' or 'Events' from Supabase and sticks it on the HTML
            card.setAttribute('data-cat', m.category); 

            card.innerHTML = `
                <img src="${m.image_url}" onerror="this.src='https://via.placeholder.com/150'">
                <h4>${m.name}</h4>
                <p>${m.description}</p>
            `;
            
            card.onclick = () => renderItems(m.id, m.name, m.whatsapp_number);
            list.appendChild(card);
        });

        // --- ADD THIS LINE ---
        // This ensures if a filter was already clicked, it applies to the new cards
        filterMarkets(); 

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
