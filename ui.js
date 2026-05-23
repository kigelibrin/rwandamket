// ==========================================================================
// 1. GLOBAL STATE & MEMORY RECOVERY
// ==========================================================================
let cart = [];
let currentMarketWhatsApp = "";
let currentMarketMoMo = ""; // Tracks active vendor's MoMo number dynamically
let userLocationSetting = "remember"; // Tracks location retention preferences ('remember' | 'ask')

// Unified initialization loop prevents event state collisions
document.addEventListener('DOMContentLoaded', () => {
    // A. Sync Theme State instantly before first content paint
    initTheme();

    // B. Guard Check: Evaluate delivery destination data footprint before browsing
    checkSavedLocation();

    // C. Initial Application Data Load
    renderMarkets();

    // D. Static Event Listeners Binding (Replacing old HTML inline onclick elements)
    setupStaticEventListeners();
});

/* ==========================================================================
   2. INITIALIZATION & EVENT LINKING
   ========================================================================== */
function setupStaticEventListeners() {
    // Theme Toggle
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

    // Share Application Action
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) shareBtn.addEventListener('click', shareApp);

    // Hero Call-to-action Button
    const getStartedBtn = document.getElementById('get-started-btn');
    if (getStartedBtn) getStartedBtn.addEventListener('click', scrollToMarkets);

    // Terms Modal Open Link
    const openTermsLink = document.getElementById('open-terms-link');
    if (openTermsLink) openTermsLink.addEventListener('click', openTerms);

    // Terms Modal Close Button Hooks
    const closeModalBtn = document.getElementById('close-modal-btn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeTerms);
    
    const acceptTermsBtn = document.getElementById('accept-terms-btn');
    if (acceptTermsBtn) acceptTermsBtn.addEventListener('click', closeTerms);

    // Clear Shopping Cart Hook
    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);

    // Send Checkout Order Action (Triggers Payment Modal instead of immediate WhatsApp)
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) return;
            
            // Inject the selected vendor's MoMo number into the modal notice row
            const displayEl = document.getElementById('merchant-momo-display');
            if (displayEl) {
                displayEl.innerText = currentMarketMoMo || "Provided on request";
            }
            
            document.getElementById('paymentModal').style.display = 'flex';
        });
    }

    // Close Payment Modal Action
    const closePaymentBtn = document.getElementById('close-payment-btn');
    if (closePaymentBtn) {
        closePaymentBtn.addEventListener('click', () => {
            document.getElementById('paymentModal').style.display = 'none';
        });
    }

    // Intercept payment form submit to trigger structured order execution
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendOrder();
        });
    }

    // Global Modal Click-Away Overlay Guard
    window.addEventListener('click', (event) => {
        const termsModal = document.getElementById('termsModal');
        if (event.target === termsModal) {
            closeTerms();
        }
        const paymentModal = document.getElementById('paymentModal');
        if (event.target === paymentModal) {
            paymentModal.style.display = 'none';
        }
    });

    // Dynamic Live-Search Event Handling
    const searchInput = document.getElementById('marketSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleMarketSearch);
    }

    // Category Filter Chip Click Routing
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            filterMarkets();
        });
    });
}

/* ==========================================================================
   3. LOCATION SELECTOR COMPONENT LOGIC
   ========================================================================== */
function checkSavedLocation() {
    const savedCity = localStorage.getItem('user_delivery_city');
    const modal = document.getElementById('locationModal');
    
    if (savedCity) {
        // City validation trace present: bypass prompt
        if (modal) modal.style.display = 'none';
        
        // Auto-seed existing checkout address element rows if present
        const addressInput = document.getElementById('cust-location');
        if (addressInput && !addressInput.value) {
            addressInput.value = `${savedCity}, `;
        }
    } else {
        // No location found: invoke forced layout intercept selection modal
        if (modal) modal.style.display = 'flex';
    }
    
    // Wire context actions to the custom location structure buttons
    initLocationListeners();
}

function initLocationListeners() {
    const modal = document.getElementById('locationModal');
    const toggleRemember = document.getElementById('loc-remember');
    const toggleAsk = document.getElementById('loc-ask');
    
    if (!modal) return;

    // Toggle button pill state handlers
    if (toggleRemember && toggleAsk) {
        toggleRemember.addEventListener('click', () => {
            toggleRemember.classList.add('active');
            toggleAsk.classList.remove('active');
            userLocationSetting = "remember";
        });
        
        toggleAsk.addEventListener('click', () => {
            toggleAsk.classList.add('active');
            toggleRemember.classList.remove('active');
            userLocationSetting = "ask";
        });
    }

    // Location selection card components routing logic
    document.querySelectorAll('.location-option-card').forEach(card => {
        card.addEventListener('click', function() {
            const selectedCity = this.getAttribute('data-city');
            
            if (userLocationSetting === "remember") {
                localStorage.setItem('user_delivery_city', selectedCity);
            } else {
                localStorage.removeItem('user_delivery_city'); // Evict data traces
            }
            
            // Forward city text metadata directly to lower checkout order forms
            const addressInput = document.getElementById('cust-location');
            if (addressInput) {
                addressInput.value = `${selectedCity}, `;
            }
            
            // Clean modal view exit dismiss closure animation transition
            modal.style.display = 'none';
        });
    });
}

/* ==========================================================================
   4. DATA RENDERING (MARKETS & PRODUCTS)
   ========================================================================== */
async function renderMarkets() {
    const list = document.getElementById('market-list');
    if (!list) return;
    
    list.innerHTML = "<p style='text-align:center; width:100%; grid-column: 1/-1;'>Loading Markets...</p>";

    try {
        // Connected directly to clean api.js layer
        const markets = await fetchMarketsFromSupabase();
        
        list.innerHTML = ""; 
        
        if (markets.length === 0) {
            list.innerHTML = "<p style='text-align:center; width:100%; grid-column:1/-1;'>No markets found.</p>";
            return;
        }

        markets.forEach(m => {
            const card = document.createElement('div');
            card.className = 'market-card';
            card.setAttribute('data-cat', m.category || "General"); 

            card.innerHTML = `
                <img src="${m.image_url}" onerror="this.src='https://via.placeholder.com/150'" alt="${m.name}">
                <h4>${m.name}</h4>
                <p>${m.description || ''}</p>
            `;
            
            // Pass the custom momo_number field value straight out of the database layout here
            card.addEventListener('click', () => renderItems(m.id, m.name, m.whatsapp_number, m.momo_number));
            list.appendChild(card);
        });

        filterMarkets(); 

    } catch (e) {
        console.error("Failed rendering markets:", e);
        list.innerHTML = "<p style='text-align:center; width:100%; grid-column:1/-1;'>Error loading markets.</p>";
    }
}

async function renderItems(marketId, marketName, whatsapp, marketMomo) {
    const list = document.getElementById('market-list');
    if (!list) return;
    
    list.innerHTML = "<p style='text-align:center; width:100%; grid-column:1/-1;'>Fetching products...</p>";

    try {
        // Connected directly to clean api.js layer matching Option A (products table)
        const products = await fetchItemsByMarket(marketId);

        // Clean slate rewrite with precise programmatic grid layout isolation
        list.innerHTML = `
            <div id="product-view-header" style="margin-bottom:20px; display:flex; align-items:center; gap:10px; width:100%; grid-column:1/-1;">
                <button id="back-to-markets-btn" style="background:#eee; border:none; padding:8px 12px; border-radius:10px; font-weight:bold; cursor:pointer;">← Back</button>
                <h3 style="margin:0;">${marketName}</h3>
            </div>
        `;

        // Bind the back button action natively inside execution stream
        document.getElementById('back-to-markets-btn').addEventListener('click', renderMarkets);

        if (products.length === 0) {
            list.innerHTML += "<p style='text-align:center; padding:20px; width:100%; grid-column:1/-1;'>Coming soon! No products yet.</p>";
            return;
        }

        products.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'market-card';
            itemCard.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px; width:100%;">
                    <img src="${item.image_url}" onerror="this.src='https://via.placeholder.com/150'" style="width:70px; height:70px; border-radius:12px; object-fit:cover;" alt="${item.name}">
                    <div style="flex:1; text-align:left;">
                        <h4 style="margin:0; font-size:0.9rem;">${item.name}</h4>
                        <span class="price-tag">${parseInt(item.price).toLocaleString()} RWF</span>
                    </div>
                    <button class="btn-primary add-to-cart-btn" style="padding:8px 12px; font-size:0.7rem;">Order</button>
                </div>
            `;
            
            const orderBtn = itemCard.querySelector('.add-to-cart-btn');
            orderBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Security check guarding against multi-vendor routing splits
                if (cart.length > 0 && currentMarketWhatsApp !== whatsapp) {
                    const confirmClear = confirm("You have items from another vendor in your cart. Clear cart to order from this vendor?");
                    if (confirmClear) {
                        clearCart();
                    } else {
                        return; // Halt item integration
                    }
                }
                
                // Track item transaction details coupled with parent market variables
                addToCart(item, whatsapp, marketMomo);
                orderBtn.innerText = "Added! ✅";
                setTimeout(() => orderBtn.innerText = "Order", 1000);
            });
            
            list.appendChild(itemCard);
        });
    } catch (e) {
        console.error("Failed rendering items:", e);
        list.innerHTML = "<p style='text-align:center; width:100%; grid-column:1/-1;'>Error loading items.</p>";
    }
}

/* ==========================================================================
   5. FILTER & TEXT SEARCH ENGINE
   ========================================================================== */
function handleMarketSearch(e) {
    const term = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.market-card');
    const list = document.getElementById('market-list');
    let visibleCount = 0;

    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        if (text.includes(term)) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    let noResultsMsg = document.getElementById('no-results');
    if (visibleCount === 0) {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('p');
            noResultsMsg.id = 'no-results';
            noResultsMsg.style.cssText = "text-align:center; padding:40px; color:#666; width:100%; grid-column:1/-1;";
            noResultsMsg.innerHTML = `🔍 No results found for "<strong>${e.target.value}</strong>"<br><small>Try checking your spelling or search other categories.</small>`;
            list.appendChild(noResultsMsg);
        }
    } else {
        if (noResultsMsg) noResultsMsg.remove();
    }
}

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

/* ==========================================================================
   6. CART TRANSACTION MANAGEMENT
   ========================================================================== */
function addToCart(item, whatsapp, momoNumber) {
    cart.push(item);
    currentMarketWhatsApp = whatsapp; 
    currentMarketMoMo = momoNumber || "Provided upon confirmation"; 
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
    currentMarketWhatsApp = "";
    currentMarketMoMo = ""; 
    updateCartUI();
}

function sendOrder() {
    if (cart.length === 0) return;

    // Gather values filled out inside the modal form fields
    const customerName = document.getElementById('cust-name').value;
    const customerLocation = document.getElementById('cust-location').value;
    const customerMomo = document.getElementById('cust-momo').value;

    const orderId = "RWA-" + Math.floor(1000 + Math.random() * 9000);
    let itemDetails = cart.map(item => `- ${item.name} (${parseInt(item.price).toLocaleString()} RWF)`).join('\n');
    const total = document.getElementById('cart-total').innerText;
    
    // Assembles order details along with delivery and payment references
    const message = encodeURIComponent(
        `📌 *NEW ORDER: ${orderId}*\n` +
        `--------------------------\n` +
        `👤 *Customer:* ${customerName}\n` +
        `📍 *Delivery To:* ${customerLocation}\n` +
        `💸 *MoMo Account:* ${customerMomo}\n` +
        `--------------------------\n` +
        `🛒 *Items Ordered:*\n` +
        `${itemDetails}\n` +
        `--------------------------\n` +
        `💰 *Total Bill: ${total}*\n\n` +
        `Please confirm my order and send a MoMo push request. Thanks!`
    );

    // Hide payment display interface context
    document.getElementById('paymentModal').style.display = 'none';

    // Clear cart and reset form inputs gracefully
    clearCart();
    document.getElementById('checkout-form').reset();

    window.open(`https://wa.me/${currentMarketWhatsApp.replace(/\D/g, '')}?text=${message}`, '_blank');
}

/* ==========================================================================
   7. INTERACTIVE UTILITIES (MODALS, THEMES, COMPONENT CONTROLS)
   ========================================================================== */
function toggleFAQ(button) {
    const answer = button.nextElementSibling;
    const icon = button.querySelector('span');
    const isOpen = answer.style.display === "block";

    document.querySelectorAll('.faq-answer').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.faq-question span').forEach(sp => sp.innerText = '+');

    if (!isOpen) {
        answer.style.display = "block";
        icon.innerText = "-";
    } else {
        answer.style.display = "none";
        icon.innerText = "+";
    }
}

function openTerms() { document.getElementById('termsModal').style.display = 'flex'; }
function closeTerms() { document.getElementById('termsModal').style.display = 'none'; }

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    const btn = document.getElementById('theme-toggle');
    
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        if (btn) btn.innerText = '☀️';
    }
}

function toggleTheme() {
    const body = document.body;
    const btn = document.getElementById('theme-toggle');
    
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        if (btn) btn.innerText = '☀️';
    } else {
        localStorage.setItem('theme', 'light');
        if (btn) btn.innerText = '🌙';
    }
}

async function shareApp() {
    const btn = document.getElementById('share-btn');
    const originalIcon = btn.innerText;
    
    try {
        btn.innerText = '⌛';
        const shareData = {
            title: 'Rwandamket',
            text: 'Check out Rwandamket for premium chefs, decor, and grocery delivery in Kigali!',
            url: window.location.href
        };

        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    } catch (err) {
        console.log('Share processing paused or exited');
    } finally {
        btn.innerText = originalIcon;
    }
}

function scrollToMarkets() {
    const marketSection = document.getElementById('markets'); 
    if (marketSection) {
        const headerOffset = 90; 
        const elementPosition = marketSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    }
}
