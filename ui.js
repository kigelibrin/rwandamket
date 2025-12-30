// --- 1. GLOBAL STATE & INITIAL LOAD ---
let cart = [];
let currentMarketWhatsApp = "";

document.addEventListener('DOMContentLoaded', () => {
    renderMarkets(); // Starts the app by showing markets

    // Setup Search Bar
    const searchInput = document.getElementById('marketSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.market-card');
            cards.forEach(card => {
                const text = card.innerText.toLowerCase();
                card.style.display = text.includes(term) ? 'flex' : 'none';
            });
        });
    }

    // Setup Category Chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.onclick = function() {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            filterMarkets();
        };
    });
});

// --- 2. MARKET RENDERING ---
async function renderMarkets() {
    const list = document.getElementById('market-list');
    list.innerHTML = "<p style='text-align:center;'>Loading Markets...</p>";

    try {
        const { data: markets, error } = await _supabase.from('markets').select('*');
        if (error) throw error;

        list.innerHTML = ""; 
        markets.forEach(m => {
            const card = document.createElement('div');
            card.className = 'market-card';
            card.setAttribute('data-cat', m.category || "General"); 

            card.innerHTML = `
                <img src="${m.image_url}" onerror="this.src='https://via.placeholder.com/150'">
                <h4>${m.name}</h4>
                <p>${m.description}</p>
            `;
            
            card.onclick = () => renderItems(m.id, m.name, m.whatsapp_number);
            list.appendChild(card);
        });

        filterMarkets(); // Apply current category filter to new cards

    } catch (e) {
        console.error(e);
        list.innerHTML = "<p>Error loading markets.</p>";
    }
}

// --- 3. ITEM RENDERING ---
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
            <div style="margin-bottom:20px; display:flex; align-items:center; gap:10px; width:100%;">
                <button onclick="renderMarkets()" style="background:#eee; border:none; padding:8px 12px; border-radius:10px; font-weight:bold; cursor:pointer;">← Back</button>
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
                    <img src="${item.image_url}" onerror="this.src='https://via.placeholder.com/150'" style="width:70px; height:70px; border-radius:12px; object-fit:cover;">
                    <div style="flex:1;">
                        <h4 style="margin:0; font-size:0.9rem;">${item.name}</h4>
                        <span class="price-tag">${item.price}</span>
                    </div>
                    <button class="btn-primary add-to-cart-btn" style="padding:8px 12px; font-size:0.7rem;">Order</button>
                </div>
            `;
            
            // Cart Logic
            const orderBtn = itemCard.querySelector('.add-to-cart-btn');
            orderBtn.onclick = (e) => {
                e.stopPropagation();
                addToCart(item, whatsapp);
                orderBtn.innerText = "Added! ✅";
                setTimeout(() => orderBtn.innerText = "Order", 1000);
            };
            
            list.appendChild(itemCard);
        });
    } catch (e) {
        console.error(e);
        list.innerHTML = "<p>Error loading items.</p>";
    }
}

// --- 4. FILTER & CART LOGIC ---
function filterMarkets() {
    const activeChip = document.querySelector('.filter-chip.active');
    if (!activeChip) return;

    const selectedCategory = activeChip.getAttribute('data-category').toLowerCase();
    const cards = document.querySelectorAll('.market-card');

    cards.forEach(card => {
        const cardCategory = (card.getAttribute('data-cat') || "").toLowerCase();
        if (selectedCategory === 'all' || cardCategory === selectedCategory) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function addToCart(item, whatsapp) {
    cart.push(item);
    currentMarketWhatsApp = whatsapp; 
    updateCartUI();
}

function updateCartUI() {
    const bar = document.getElementById('cart-bar');
    const countLabel = document.getElementById('cart-count');
    const totalLabel = document.getElementById('cart-total');

    if (cart.length > 0) {
        bar.classList.remove('hidden');
        countLabel.innerText = `${cart.length} item${cart.length > 1 ? 's' : ''}`;
        
        const total = cart.reduce((sum, item) => {
            const priceNum = parseInt(item.price.toString().replace(/\D/g, '')) || 0;
            return sum + priceNum;
        }, 0);
        
        totalLabel.innerText = `${total.toLocaleString()} RWF`;
    } else {
        bar.classList.add('hidden');
    }
}

function clearCart() {
    cart = [];
    updateCartUI();
}

function sendOrder() {
    if (cart.length === 0) return;
    let itemDetails = cart.map(item => `- ${item.name} (${item.price})`).join('\n');
    const total = document.getElementById('cart-total').innerText;
    const message = encodeURIComponent(`Hello! I would like to order:\n\n${itemDetails}\n\n*Total: ${total}*`);
    window.open(`https://wa.me/${currentMarketWhatsApp.replace(/\D/g, '')}?text=${message}`, '_blank');
}
// ui.js
function scrollToMarkets() {
    const marketSection = document.getElementById('market-list');
    marketSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}
