// ==========================================================================
// 1. GLOBAL STATE & MEMORY RECOVERY
// ==========================================================================
let cart = [];
let currentMarketId = null; // Track database primary key link
let currentMarketWhatsApp = "";
let currentMarketMoMo = ""; 
let userLocationSetting = "remember"; 

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

    // Intercept payment form submit to trigger direct in-app structured order processing loop
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            processInAppMomoPayment();
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
        if (modal) modal.style.display = 'none';
        
        const addressInput = document.getElementById('cust-location');
        if (addressInput && !addressInput.value) {
            addressInput.value = `${savedCity}, `;
        }
    } else {
        if (modal) modal.style.display = 'flex';
    }
    
    initLocationListeners();
}

function initLocationListeners() {
    const modal = document.getElementById('locationModal');
    const toggleRemember = document.getElementById('loc-remember');
    const toggleAsk = document.getElementById('loc-ask');
    
    if (!modal) return;

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

    document.querySelectorAll('.location-option-card').forEach(card => {
        card.addEventListener('click', function() {
            const selectedCity = this.getAttribute('data-city');
            
            if (userLocationSetting === "remember") {
                localStorage.setItem('user_delivery_city', selectedCity);
            } else {
                localStorage.removeItem('user_delivery_city');
            }
            
            const addressInput = document.getElementById('cust-location');
            if (addressInput) {
                addressInput.value = `${selectedCity}, `;
            }
            
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
        const products = await fetchItemsByMarket(marketId);

        list.innerHTML = `
            <div id="product-view-header" style="margin-bottom:20px; display:flex; align-items:center; gap:10px; width:100%; grid-column:1/-1;">
                <button id="back-to-markets-btn" style="background:#eee; border:none; padding:8px 12px; border-radius:10px; font-weight:bold; cursor:pointer;">← Back</button>
                <h3 style="margin:0;">${marketName}</h3>
            </div>
        `;

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
                
                if (cart.length > 0 && currentMarketWhatsApp !== whatsapp) {
                    const confirmClear = confirm("You have items from another vendor in your cart. Clear cart to order from this vendor?");
                    if (confirmClear) {
                        clearCart();
                    } else {
                        return; 
                    }
                }
                
                addToCart(item, marketId, whatsapp, marketMomo);
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
function addToCart(item, marketId, whatsapp, momoNumber) {
    cart.push(item);
    currentMarketId = marketId;
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
        
        const total = getCartTotalValue();
        totalLabel.innerText = `${total.toLocaleString()} RWF`;
    } else {
        bar.classList.add('hidden');
    }
}

function getCartTotalValue() {
    return cart.reduce((sum, item) => {
        const priceNum = parseInt(item.price.toString().replace(/\D/g, '')) || 0;
        return sum + priceNum;
    }, 0);
}

function clearCart() {
    cart = [];
    currentMarketId = null;
    currentMarketWhatsApp = "";
    currentMarketMoMo = ""; 
    updateCartUI();
}

/* ==========================================================================
   7. IN-APP COMPACT PAYPACK MOMO GATEWAY PIPELINE
   ========================================================================== */
async function processInAppMomoPayment() {
    if (cart.length === 0) return;

    const submitBtn = document.querySelector('#checkout-form button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerText : "Order and Pay 🚀";

    // Gather modal form values 
    const customerName = document.getElementById('cust-name').value;
    const customerLocation = document.getElementById('cust-location').value;
    const customerMomo = document.getElementById('cust-momo').value; // e.g. 078XXXXXXX or 072XXXXXXX
    const totalAmount = getCartTotalValue();

    // Map cart components into structural programmatic object architecture
    const structuralItemsArray = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: parseInt(item.price)
    }));

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Processing PIN prompt... 📲";
    }

    try {
        // STEP 1: Insert dynamic record securely directly into the Supabase database
        const { data: databaseOrder, error: dbError } = await _supabase
            .from('orders')
            .insert([{
                market_id: currentMarketId,
                customer_name: customerName,
                delivery_address: customerLocation,
                phone_number: customerMomo,
                total_amount: totalAmount,
                items: structuralItemsArray,
                payment_status: 'pending',
                order_status: 'received'
            }])
            .select()
            .single();

        if (dbError) throw new Error(`Database entry initialization error: ${dbError.message}`);

        // STEP 2: Issue dynamic remote request out to Paypack Cashin API Endpoint
        const gatewayResponse = await fetch('https://api.paypack.rw/v1/transactions/cashin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer YOUR_PRODUCTION_API_ACCESS_TOKEN` // Swap out securely via backend
            },
            body: JSON.stringify({
                amount: totalAmount,
                number: customerMomo,
                client_id: databaseOrder.id 
            })
        });

        const gatewayData = await gatewayResponse.json();

        if (!gatewayResponse.ok || gatewayData.status !== 'pending') {
            await _supabase.from('orders').update({ payment_status: 'failed' }).eq('id', databaseOrder.id);
            throw new Error("Transaction request rejected by the telecom network provider.");
        }

        // Keep a trace of payment reference tokens on the data layer row tracking record
        await _supabase
            .from('orders')
            .update({ transaction_ref: gatewayData.ref })
            .eq('id', databaseOrder.id);

        // STEP 3: Enter internal status evaluation loop to track PIN authorization state
        const isTransactionApproved = await pollTransactionVerificationLoop(databaseOrder.id, gatewayData.ref);

        if (isTransactionApproved) {
            alert("✨ Payment Confirmed! Your order has been securely transferred to the merchant dashboard.");
            document.getElementById('paymentModal').style.display = 'none';
            clearCart();
            document.getElementById('checkout-form').reset();
        } else {
            alert("❌ Transaction failed or timed out. Please retry checkout initialization.");
        }

    } catch (err) {
        console.error("Payment sequence broke down:", err);
        alert(`Payment error occurred: ${err.message}`);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        }
    }
}

/**
 * Long-polls transaction statuses sequentially across fixed wait breaks
 */
async function pollTransactionVerificationLoop(orderId, referenceCode, iterationStep = 0) {
    if (iterationStep > 12) return false; // Hard break halt caps limits at 60 seconds

    // 5-second interval allowance provides human transaction comfort space
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
        const checkRequest = await fetch(`https://api.paypack.rw/v1/transactions/find/${referenceCode}`, {
            headers: { 'Authorization': `Bearer YOUR_PRODUCTION_API_ACCESS_TOKEN` }
        });
        const checkResult = await checkRequest.json();

        if (checkResult.status === 'successful') {
            await _supabase.from('orders').update({ payment_status: 'paid' }).eq('id', orderId);
            return true;
        } else if (checkResult.status === 'failed') {
            await _supabase.from('orders').update({ payment_status: 'failed' }).eq('id', orderId);
            return false;
        }
    } catch (pollingException) {
        console.warn("Polling request lookup skipped:", pollingException);
    }

    return pollTransactionVerificationLoop(orderId, referenceCode, iterationStep + 1);
}

/* ==========================================================================
   8. INTERACTIVE UTILITIES (MODALS, THEMES, COMPONENT CONTROLS)
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
