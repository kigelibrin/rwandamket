/* ==========================================================================
   UI INTERACTION CONTROLLER (UI.JS)
   ========================================================================== */

const SUPABASE_FUNCTIONS_URL = 'https://bulxwiknhwafvfzodheb.supabase.co/functions/v1';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bHh3aWtuaHdhZnZmem9kaGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Nzc1ODUsImV4cCI6MjA4MjM1MzU4NX0.WcEwx0wUkfOr2DgaztIXqdKfnYfK6ERsumGuLblF_kI';

// 1. GLOBAL STATE
let CURRENT_CART = [];
let ACTIVE_MARKET_ID = null;
let SELECTED_VENDOR_MOMO = '';
let ACTIVE_CITY_FILTER = null;

const domElements = {
    marketList:          document.getElementById('market-list'),
    marketSearch:        document.getElementById('marketSearch'),
    categoryFilters:     document.getElementById('categoryFilters'),
    cartBar:             document.getElementById('cart-bar'),
    cartCount:           document.getElementById('cart-count'),
    cartTotal:           document.getElementById('cart-total'),
    checkoutBtn:         document.getElementById('checkout-btn'),
    clearCartBtn:        document.getElementById('clear-cart-btn'),
    paymentModal:        document.getElementById('paymentModal'),
    closePaymentBtn:     document.getElementById('close-payment-btn'),
    merchantMomoDisplay: document.getElementById('merchant-momo-display'),
    checkoutForm:        document.getElementById('checkout-form'),
    submitOrderBtn:      document.getElementById('submit-order-btn'),
    locationModal:       document.getElementById('locationModal'),
    shareBtn:            document.getElementById('share-btn')
};

/* ==========================================================================
   2. INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    initializeLocationContext();
    setupCoreEventListeners();
    setupFAQAccordions();
    setupStaticModalListeners();
});

function setupStaticModalListeners() {
    const termsModal     = document.getElementById('termsModal');
    const openTermsLink  = document.getElementById('open-terms-link');
    const closeModalBtn  = document.getElementById('close-modal-btn');
    const acceptTermsBtn = document.getElementById('accept-terms-btn');

    if (openTermsLink)  openTermsLink.addEventListener('click',  () => termsModal.style.display = 'flex');
    if (closeModalBtn)  closeModalBtn.addEventListener('click',  () => termsModal.style.display = 'none');
    if (acceptTermsBtn) acceptTermsBtn.addEventListener('click', () => termsModal.style.display = 'none');
    if (domElements.shareBtn) domElements.shareBtn.addEventListener('click', shareApp);

    const getStartedBtn = document.getElementById('get-started-btn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            document.getElementById('markets')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === domElements.paymentModal) domElements.paymentModal.style.display = 'none';
        if (e.target === domElements.locationModal && ACTIVE_CITY_FILTER) {
            domElements.locationModal.style.display = 'none';
        }
        if (e.target === termsModal) termsModal.style.display = 'none';
    });
}

/* ==========================================================================
   3. LOCATION CONTEXT
   ========================================================================== */
function initializeLocationContext() {
    const savedCity      = localStorage.getItem('user_delivery_city');
    const shouldRemember = localStorage.getItem('loc_remember_choice') !== 'false';
    const rememberBtn    = document.getElementById('loc-remember');
    const askBtn         = document.getElementById('loc-ask');

    if (rememberBtn && askBtn) {
        if (!shouldRemember) {
            askBtn.classList.add('active');
            rememberBtn.classList.remove('active');
        }
        rememberBtn.addEventListener('click', () => {
            rememberBtn.classList.add('active');
            askBtn.classList.remove('active');
            localStorage.setItem('loc_remember_choice', 'true');
        });
        askBtn.addEventListener('click', () => {
            askBtn.classList.add('active');
            rememberBtn.classList.remove('active');
            localStorage.setItem('loc_remember_choice', 'false');
        });
    }

    if (savedCity && shouldRemember) {
        ACTIVE_CITY_FILTER = savedCity;
        prefillDeliveryAddress(savedCity);
        loadEcosystemVendors();
    } else {
        domElements.locationModal.style.display = 'flex';
    }

    document.querySelectorAll('.location-option-card').forEach(card => {
        card.addEventListener('click', () => {
            const chosenCity     = card.getAttribute('data-city');
            const isRemembering  = rememberBtn ? rememberBtn.classList.contains('active') : true;

            if (isRemembering) {
                localStorage.setItem('user_delivery_city', chosenCity);
                localStorage.setItem('loc_remember_choice', 'true');
            } else {
                localStorage.removeItem('user_delivery_city');
                localStorage.setItem('loc_remember_choice', 'false');
            }

            ACTIVE_CITY_FILTER = chosenCity;
            prefillDeliveryAddress(chosenCity);
            domElements.locationModal.style.display = 'none';
            loadEcosystemVendors();
        });
    });
}

function prefillDeliveryAddress(city) {
    const addressInput = document.getElementById('cust-location');
    if (addressInput) addressInput.value = `${city}, `;
}

/* ==========================================================================
   4. CORE EVENT LISTENERS
   ========================================================================== */
function setupCoreEventListeners() {
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
            themeBtn.textContent = '☀️';
        }
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            themeBtn.textContent = isDark ? '☀️' : '🌙';
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    if (domElements.marketSearch) {
        domElements.marketSearch.addEventListener('input', (e) => {
            filterMarketsDisplay(e.target.value.trim().toLowerCase());
        });
    }

    if (domElements.categoryFilters) {
        domElements.categoryFilters.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                domElements.categoryFilters.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                filterMarketsByCategory(chip.getAttribute('data-category'));
            });
        });
    }

    if (domElements.checkoutBtn)     domElements.checkoutBtn.addEventListener('click', openCheckoutGateway);
    if (domElements.closePaymentBtn) domElements.closePaymentBtn.addEventListener('click', () => domElements.paymentModal.style.display = 'none');
    if (domElements.clearCartBtn)    domElements.clearCartBtn.addEventListener('click', clearActiveCartState);
    if (domElements.checkoutForm)    domElements.checkoutForm.addEventListener('submit', handleOrderPaymentSubmission);
}

/* ==========================================================================
   5. MARKET & PRODUCT RENDERING
   ========================================================================== */
async function loadEcosystemVendors() {
    if (!domElements.marketList) return;
    domElements.marketList.innerHTML = `<div class="state-message"><span class="loading-spinner"></span> Loading markets near ${ACTIVE_CITY_FILTER}...</div>`;

    try {
        const markets = await fetchMarketsFromSupabase(ACTIVE_CITY_FILTER);
        if (!markets || markets.length === 0) {
            domElements.marketList.innerHTML = `
                <div class="state-message">
                    <p>No active markets serving <strong>${ACTIVE_CITY_FILTER}</strong> right now.</p>
                    <button class="btn-primary" onclick="domElements.locationModal.style.display='flex'" style="margin-top:12px;">Change City</button>
                </div>`;
            return;
        }
        renderMarketCardsGrid(markets);
    } catch (err) {
        console.error("loadEcosystemVendors error:", err);
        domElements.marketList.innerHTML = `<div class="state-message">Failed to load vendors. Please refresh.</div>`;
    }
}

function renderMarketCardsGrid(marketsArray) {
    domElements.marketList.innerHTML = '';
    marketsArray.forEach(market => {
        const card = document.createElement('div');
        card.className = 'market-card';
        card.setAttribute('data-category', market.category || 'Food');
        card.setAttribute('data-name', (market.name || '').toLowerCase());
        card.innerHTML = `
            <img src="${market.image_url || 'image.png'}" alt="${market.name}" onerror="this.src='image.png'">
            <h4>${market.name}</h4>
            <p>${market.description || 'Premium local verified vendor'}</p>
            <button class="btn-primary view-products-btn" data-id="${market.id}" data-momo="${market.momo_number || 'Direct Pay'}">
                View Catalog &rarr;
            </button>`;
        domElements.marketList.appendChild(card);
    });

    domElements.marketList.querySelectorAll('.view-products-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            revealMarketItemCatalog(btn.getAttribute('data-id'), btn.getAttribute('data-momo'));
        });
    });

    const activeChip = domElements.categoryFilters?.querySelector('.filter-chip.active');
    if (activeChip) filterMarketsByCategory(activeChip.getAttribute('data-category'));
}

async function revealMarketItemCatalog(marketId, vendorMomo) {
    ACTIVE_MARKET_ID     = Number(marketId);
    SELECTED_VENDOR_MOMO = vendorMomo;
    domElements.marketList.innerHTML = `<div class="state-message"><span class="loading-spinner"></span> Loading products...</div>`;

    try {
        const items = await fetchItemsByMarket(marketId);
        if (!items || items.length === 0) {
            domElements.marketList.innerHTML = `
                <div class="state-message">
                    <p>No products listed yet for this vendor.</p>
                    <button class="btn-primary" onclick="loadEcosystemVendors()">← Back to Markets</button>
                </div>`;
            return;
        }

        domElements.marketList.innerHTML = `
            <div class="catalog-back-row" style="grid-column:1/-1;">
                <button class="btn-primary btn-back" onclick="loadEcosystemVendors()">← Back to Markets</button>
            </div>`;

        items.forEach(product => {
            const card = document.createElement('div');
            card.className = 'market-card';
            card.innerHTML = `
                <img src="${product.image_url || 'image.png'}" alt="${product.name}" onerror="this.src='image.png'">
                <h4>${product.name}</h4>
                <span class="price-tag">${Number(product.price).toLocaleString()} RWF</span>
                <button class="btn-primary add-to-cart-btn"
                    data-id="${product.id}"
                    data-name="${product.name}"
                    data-price="${product.price}">
                    Add to Order ➕
                </button>`;
            domElements.marketList.appendChild(card);
        });

        domElements.marketList.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', appendProductToCartState);
        });
    } catch (err) {
        console.error("revealMarketItemCatalog error:", err);
        domElements.marketList.innerHTML = `<div class="state-message">Error loading products. Please try again.</div>`;
    }
}

/* ==========================================================================
   6. CART
   ========================================================================== */
function appendProductToCartState(e) {
    const btn  = e.currentTarget;
    const item = {
        id:       btn.getAttribute('data-id'),
        name:     btn.getAttribute('data-name'),
        price:    Number(btn.getAttribute('data-price')),
        quantity: 1
    };

    const existing = CURRENT_CART.findIndex(c => c.id === item.id);
    if (existing > -1) {
        CURRENT_CART[existing].quantity += 1;
    } else {
        CURRENT_CART.push(item);
    }

    refreshCartUIFooterPanel();
    btn.textContent = 'Added! ✓';
    btn.style.background = '#2E7D32';
    setTimeout(() => {
        btn.textContent = 'Add to Order ➕';
        btn.style.background = '#00A859';
    }, 800);
}

function refreshCartUIFooterPanel() {
    const totalQty = CURRENT_CART.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmt = CURRENT_CART.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (totalQty > 0) {
        domElements.cartCount.textContent = `${totalQty} item${totalQty > 1 ? 's' : ''} added`;
        domElements.cartTotal.textContent  = `${totalAmt.toLocaleString()} RWF`;
        domElements.cartBar.classList.remove('hidden');
    } else {
        domElements.cartBar.classList.add('hidden');
    }
}

function clearActiveCartState() {
    CURRENT_CART = [];
    refreshCartUIFooterPanel();
}

/* ==========================================================================
   7. REAL PAYMENT FLOW (replaces fake polling loop)
   ========================================================================== */
function openCheckoutGateway() {
    if (CURRENT_CART.length === 0) return;
    if (domElements.merchantMomoDisplay) {
        domElements.merchantMomoDisplay.textContent = SELECTED_VENDOR_MOMO || 'Rwandamket Central';
    }
    domElements.paymentModal.style.display = 'flex';
}

async function handleOrderPaymentSubmission(e) {
    e.preventDefault();

    domElements.submitOrderBtn.disabled = true;
    const originalBtnHTML = domElements.submitOrderBtn.innerHTML;
    domElements.submitOrderBtn.innerHTML = 'Saving order... ⏳';

    const orderPayload = {
        marketId:    ACTIVE_MARKET_ID,
        name:        document.getElementById('cust-name').value.trim(),
        address:     document.getElementById('cust-location').value.trim(),
        phone:       document.getElementById('cust-momo').value.trim(),
        totalAmount: CURRENT_CART.reduce((sum, item) => sum + item.price * item.quantity, 0),
        itemsArray:  CURRENT_CART
    };

    try {
        // Step 1: Save order to Supabase
        const savedRecord = await createNewOrder(orderPayload);
        if (!savedRecord) throw new Error("Order could not be saved.");

        // Step 2: Call real MTN MoMo Edge Function
        domElements.submitOrderBtn.innerHTML = 'Sending MoMo prompt... 📱';

        const payRes = await fetch(`${SUPABASE_FUNCTIONS_URL}/initiate-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`
            },
            body: JSON.stringify({
                orderId: savedRecord.id,
                amount:  orderPayload.totalAmount,
                phone:   orderPayload.phone
            })
        });
        const payData = await payRes.json();

        if (!payData.accepted) {
            throw new Error(`MoMo request failed with status ${payData.status}`);
        }

        // Step 3: Poll check-payment until confirmed or timeout
        domElements.submitOrderBtn.innerHTML = 'Waiting for your PIN... 📱';
        const confirmed = await pollPaymentStatus(savedRecord.id);

        if (confirmed) {
            // Step 4: Update order status in Supabase
            await updateOrderStatus(savedRecord.id, {
                payment_status: 'paid',
                order_status:   'preparing'
            });

            const trackingCode = `RMK-${savedRecord.id.toString().substring(0, 8).toUpperCase()}`;
            domElements.paymentModal.querySelector('.modal-content').innerHTML = `
                <div class="payment-success">
                    <div class="success-icon">✅</div>
                    <h3>Order Paid Successfully!</h3>
                    <p>Thank you, <strong>${orderPayload.name}</strong>. Your payment was confirmed.</p>
                    <div class="tracking-code-box">
                        <strong>Delivery Tracking Code:</strong><br>
                        <span class="tracking-code">${trackingCode}</span>
                    </div>
                    <p class="delivery-info">Your items are being prepared for delivery to <strong>${orderPayload.address}</strong>.</p>
                    <div style="display:flex; gap:8px; margin-top:10px;">
                        <button class="btn-primary" onclick="window.location.href='track.html?code=${trackingCode}'" style="flex:2; background:#00A859;">
                            📦 Track Order
                        </button>
                        <button class="btn-primary" onclick="window.location.reload()" style="flex:1; background:#333;">
                            Done
                        </button>
                    </div>
                </div>`;
            clearActiveCartState();
        } else {
            throw new Error("Payment was not completed in time. Please try again.");
        }

    } catch (err) {
        console.error("Payment error:", err);
        alert(`Payment issue: ${err.message}`);
        domElements.submitOrderBtn.disabled = false;
        domElements.submitOrderBtn.innerHTML = originalBtnHTML;
    }
}

/**
 * Polls check-payment Edge Function every 5 seconds, up to 12 times (60 seconds).
 * Returns true if payment confirmed, false if timed out.
 */
async function pollPaymentStatus(orderId, attempt = 0) {
    if (attempt >= 12) return false;

    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
        const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/check-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`
            },
            body: JSON.stringify({ orderId })
        });
        const data = await res.json();
        console.log(`Payment poll attempt ${attempt + 1}:`, data.status);

        if (data.paid) return true;
    } catch (err) {
        console.warn(`Poll attempt ${attempt + 1} failed:`, err);
    }

    return pollPaymentStatus(orderId, attempt + 1);
}

/* ==========================================================================
   8. FILTERS & FAQ
   ========================================================================== */
function filterMarketsDisplay(searchString) {
    const cards = domElements.marketList.querySelectorAll('.market-card');
    let visible = 0;

    cards.forEach(card => {
        const name = (card.getAttribute('data-name') || '').toLowerCase();
        const show = name.includes(searchString);
        card.style.display = show ? 'flex' : 'none';
        if (show) visible++;
    });

    let emptyMsg = document.getElementById('search-empty-notice');
    if (visible === 0 && searchString) {
        if (!emptyMsg) {
            emptyMsg = document.createElement('div');
            emptyMsg.id = 'search-empty-notice';
            emptyMsg.className = 'state-message';
            emptyMsg.style.gridColumn = '1 / -1';
            emptyMsg.innerHTML = `🔍 No vendors found matching "<strong>${searchString}</strong>"`;
            domElements.marketList.appendChild(emptyMsg);
        }
    } else {
        emptyMsg?.remove();
    }
}

function filterMarketsByCategory(category) {
    const cards = domElements.marketList.querySelectorAll('.market-card');
    cards.forEach(card => {
        if (category.toLowerCase() === 'all') { card.style.display = 'flex'; return; }
        const cardCat = (card.getAttribute('data-category') || '').toLowerCase();
        card.style.display = cardCat === category.toLowerCase() ? 'flex' : 'none';
    });
}

function setupFAQAccordions() {
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const answer = btn.nextElementSibling;
            const marker = btn.querySelector('span');
            const isOpen = answer.style.display === 'block';

            document.querySelectorAll('.faq-answer').forEach(a => a.style.display = 'none');
            document.querySelectorAll('.faq-question span').forEach(s => s.textContent = '+');

            if (!isOpen) {
                answer.style.display = 'block';
                if (marker) marker.textContent = '−';
            }
        });
    });
}

/* ==========================================================================
   9. SHARE
   ========================================================================== */
async function shareApp() {
    const btn = domElements.shareBtn;
    if (!btn) return;
    const original = btn.textContent;
    btn.textContent = '⌛';
    try {
        if (navigator.share) {
            await navigator.share({
                title: 'Rwandamket',
                text:  'Check out Rwandamket — premium chefs, decor, and grocery delivery in Rwanda!',
                url:   window.location.href
            });
        } else {
            await navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    } catch (err) {
        // User cancelled
    } finally {
        btn.textContent = original;
    }
}
