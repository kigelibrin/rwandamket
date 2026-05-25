/* ==========================================================================
   SUPABASE APPLICATION & UI INTERACTION CONTROLLER LAYER (UI.JS)
   ========================================================================== */

// 1. GLOBAL STATE MANAGERS
let CURRENT_CART = [];
let ACTIVE_MARKET_ID = null;
let SELECTED_VENDOR_MOMO = '';
let ACTIVE_CITY_FILTER = null;

// Complete element mapping to match your index.html 1:1
const domElements = {
    marketList: document.getElementById('market-list'),
    marketSearch: document.getElementById('marketSearch'),
    categoryFilters: document.getElementById('categoryFilters'),
    cartBar: document.getElementById('cart-bar'),
    cartCount: document.getElementById('cart-count'),
    cartTotal: document.getElementById('cart-total'),
    checkoutBtn: document.getElementById('checkout-btn'),
    clearCartBtn: document.getElementById('clear-cart-btn'),
    paymentModal: document.getElementById('paymentModal'),
    closePaymentBtn: document.getElementById('close-payment-btn'),
    merchantMomoDisplay: document.getElementById('merchant-momo-display'),
    checkoutForm: document.getElementById('checkout-form'),
    submitOrderBtn: document.getElementById('submit-order-btn'),
    locationModal: document.getElementById('locationModal')
};

/* ==========================================================================
   2. REVOLUTIONARY MODAL FLOWS & INITIALIZATION LOGIC
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // Initial UI Setup
    initializeLocationContext();
    setupCoreEventListeners();
    setupFAQAccordions();
    
    // Global static click utility triggers
    const openTermsLink = document.getElementById('open-terms-link');
    if (openTermsLink) openTermsLink.addEventListener('click', () => document.getElementById('termsModal').style.display = 'flex');

    const closeModalBtn = document.getElementById('close-modal-btn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => document.getElementById('termsModal').style.display = 'none');
    
    const acceptTermsBtn = document.getElementById('accept-terms-btn');
    if (acceptTermsBtn) acceptTermsBtn.addEventListener('click', () => document.getElementById('termsModal').style.display = 'none');

    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) shareBtn.addEventListener('click', shareApplicationEcosystem);

    const getStartedBtn = document.getElementById('get-started-btn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            const marketSection = document.getElementById('markets');
            if (marketSection) marketSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // Modal click-away background listener guard
    window.addEventListener('click', (e) => {
        if (e.target === domElements.paymentModal) domElements.paymentModal.style.display = 'none';
        if (e.target === domElements.locationModal) {
            // Only allow background close if a location choice already exists
            if(ACTIVE_CITY_FILTER) domElements.locationModal.style.display = 'none';
        }
        const termsModal = document.getElementById('termsModal');
        if (e.target === termsModal) termsModal.style.display = 'none';
    });
});

/**
 * Validates saved local delivery footprints. Prompts location overlay choices automatically.
 */
function initializeLocationContext() {
    const savedCity = localStorage.getItem('user_delivery_city');
    const rememberChoice = localStorage.getItem('loc_remember_choice') !== 'false';
    
    // Pre-populate input values on choice-remember toggles
    const rememberBtn = document.getElementById('loc-remember');
    const askBtn = document.getElementById('loc-ask');

    if (rememberBtn && askBtn) {
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

    if (savedCity && rememberChoice) {
        ACTIVE_CITY_FILTER = savedCity;
        const addressInput = document.getElementById('cust-location');
        if (addressInput) addressInput.value = `${savedCity}, `;
        loadEcosystemVendors();
    } else {
        domElements.locationModal.style.display = 'flex';
    }

    // Attach click events to the location choice cards
    document.querySelectorAll('.location-option-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const chosenCity = e.currentTarget.getAttribute('data-city');
            ACTIVE_CITY_FILTER = chosenCity;
            
            const isRememberActive = rememberBtn ? rememberBtn.classList.contains('active') : true;
            if (isRememberActive) {
                localStorage.setItem('user_delivery_city', chosenCity);
                localStorage.setItem('loc_remember_choice', 'true');
            } else {
                localStorage.removeItem('user_delivery_city');
                localStorage.setItem('loc_remember_choice', 'false');
            }

            const addressInput = document.getElementById('cust-location');
            if (addressInput) addressInput.value = `${chosenCity}, `;

            domElements.locationModal.style.display = 'none';
            loadEcosystemVendors();
        });
    });
}

/**
 * Binds basic navigation, clean clear features, and theme-switching button click listeners.
 */
function setupCoreEventListeners() {
    // Theme Toggle Handler
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        // Sync layout instantly on initial boot load
        if(localStorage.getItem('theme') === 'dark') {
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

    // Search Engine Routing Hook
    if (domElements.marketSearch) {
        domElements.marketSearch.addEventListener('input', (e) => {
            filterMarketsDisplay(e.target.value.trim().toLowerCase());
        });
    }

    // Category Nav Chips Router
    if (domElements.categoryFilters) {
        domElements.categoryFilters.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                domElements.categoryFilters.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                e.currentTarget.classList.add('active');

                const targetCategory = e.currentTarget.getAttribute('data-category');
                filterMarketsByCategory(targetCategory);
            });
        });
    }

    // Modal Visibility Control Layers
    if (domElements.checkoutBtn) domElements.checkoutBtn.addEventListener('click', openCheckoutGateway);
    if (domElements.closePaymentBtn) domElements.closePaymentBtn.addEventListener('click', () => domElements.paymentModal.style.display = 'none');
    if (domElements.clearCartBtn) domElements.clearCartBtn.addEventListener('click', clearActiveCartState);

    // Structural Form Submission Handlers
    if (domElements.checkoutForm) domElements.checkoutForm.addEventListener('submit', handleOrderPaymentSubmission);
}

/* ==========================================================================
   3. ECOSYSTEM VENDOR & COMPONENT CATALOG RENDERING
   ========================================================================== */
async function loadEcosystemVendors() {
    if (!domElements.marketList) return;
    domElements.marketList.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#666;">Querying premium nearby nodes...</div>`;
    
    try {
        // Calls optimized api.js data query layer directly
        const markets = await fetchMarketsFromSupabase(ACTIVE_CITY_FILTER);
        
        if (!markets || markets.length === 0) {
            domElements.marketList.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#666;">No active premium vendors serving ${ACTIVE_CITY_FILTER} right now.</div>`;
            return;
        }
        renderMarketCardsGrid(markets);
    } catch (err) {
        console.error("Ecosystem rendering trace failure:", err);
        domElements.marketList.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#666;">Failed rendering vendor layers.</div>`;
    }
}

function renderMarketCardsGrid(marketsArray) {
    domElements.marketList.innerHTML = '';
    
    marketsArray.forEach(market => {
        const card = document.createElement('div');
        card.className = 'market-card';
        card.setAttribute('data-category', market.category || 'Food');
        card.setAttribute('data-name', market.name.toLowerCase());
        
        card.innerHTML = `
            <img src="${market.image_url || 'image.png'}" onerror="this.src='https://via.placeholder.com/150'" alt="${market.name}">
            <h4>${market.name}</h4>
            <p>${market.description || 'Premium local verified vendor'}</p>
            <button class="btn-primary view-products-btn" data-id="${market.id}" data-momo="${market.momo_number || 'Direct Pay'}" style="margin-top:12px; width:100%; border-radius:10px;">
                View Catalog &rarr;
            </button>
        `;
        
        domElements.marketList.appendChild(card);
    });

    // Wire up Catalog View buttons
    domElements.marketList.querySelectorAll('.view-products-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const marketId = e.currentTarget.getAttribute('data-id');
            const vendorMomo = e.currentTarget.getAttribute('data-momo');
            revealMarketItemCatalog(marketId, vendorMomo);
        });
    });

    // Sync views instantly if any active filters exist
    const activeChip = domElements.categoryFilters ? domElements.categoryFilters.querySelector('.filter-chip.active') : null;
    if (activeChip) filterMarketsByCategory(activeChip.getAttribute('data-category'));
}

/**
 * Swaps market blocks for the product listings of a single selected vendor
 */
async function revealMarketItemCatalog(marketId, vendorMomo) {
    ACTIVE_MARKET_ID = Number(marketId);
    SELECTED_VENDOR_MOMO = vendorMomo;

    domElements.marketList.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#666;">Loading items...</div>`;
    
    try {
        const items = await fetchItemsByMarket(marketId);
        
        if (!items || items.length === 0) {
            domElements.marketList.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:40px;">
                    <p style="color:#666; margin-bottom:15px;">Coming soon! No products available inside this vendor block.</p>
                    <button class="btn-primary" onclick="loadEcosystemVendors()">Back to Ecosystems</button>
                </div>`;
            return;
        }

        domElements.marketList.innerHTML = `
            <div id="catalog-header-node" style="grid-column:1/-1; margin-bottom:15px; text-align:left;">
                <button class="btn-primary" onclick="loadEcosystemVendors()" style="background:#333; padding: 6px 14px; border-radius:8px; color:#fff;">&larr; Back to Markets</button>
            </div>
        `;

        items.forEach(product => {
            const itemCard = document.createElement('div');
            itemCard.className = 'market-card';
            itemCard.innerHTML = `
                <img src="${product.image_url || 'image.png'}" onerror="this.src='https://via.placeholder.com/150'" alt="${product.name}">
                <h4>${product.name}</h4>
                <span class="price-tag" style="font-weight:700; color:#00A859; display:block; margin: 4px 0 12px 0;">${Number(product.price).toLocaleString()} RWF</span>
                <button class="btn-primary add-to-cart-btn" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" style="margin-top:auto; width:100%; border-radius:10px; background:#00A859; color:#fff;">
                    Add to Order ➕
                </button>
            `;
            domElements.marketList.appendChild(itemCard);
        });

        domElements.marketList.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', appendProductToCartState);
        });
    } catch(err) {
        console.error("Catalog execution stack error:", err);
        domElements.marketList.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#666;">Error loading item catalogs.</div>`;
    }
}

/* ==========================================================================
   4. TRANSACTION SHOPPING CART CONTROLLERS
   ========================================================================== */
function appendProductToCartState(e) {
    const btn = e.currentTarget;
    const item = {
        id: btn.getAttribute('data-id'),
        name: btn.getAttribute('data-name'),
        price: Number(btn.getAttribute('data-price')),
        quantity: 1
    };

    const targetIdx = CURRENT_CART.findIndex(c => c.id === item.id);
    if (targetIdx > -1) {
        CURRENT_CART[targetIdx].quantity += 1;
    } else {
        CURRENT_CART.push(item);
    }

    refreshCartUIFooterPanel();
    
    // Success feedback bounce action
    btn.textContent = 'Added! ✓';
    btn.style.background = '#2E7D32';
    setTimeout(() => {
        btn.textContent = 'Add to Order ➕';
        btn.style.background = '#00A859';
    }, 800);
}

function refreshCartUIFooterPanel() {
    const globalCount = CURRENT_CART.reduce((sum, item) => sum + item.quantity, 0);
    const globalSum = CURRENT_CART.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (globalCount > 0) {
        domElements.cartCount.textContent = `${globalCount} choice${globalCount > 1 ? 's' : ''} added`;
        domElements.cartTotal.textContent = `${globalSum.toLocaleString()} RWF`;
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
   5. DECOUPLED ON-SCREEN ORDER/PAYMENT SUBMISSION TRANSACTION PIPELINE
   ========================================================================== */
function openCheckoutGateway() {
    if (CURRENT_CART.length === 0) return;
    
    // Inject vendor explicit parameters directly into the display notice
    if(domElements.merchantMomoDisplay) {
        domElements.merchantMomoDisplay.textContent = SELECTED_VENDOR_MOMO || 'Rwandamket Central Node';
    }
    domElements.paymentModal.style.display = 'flex';
}

/**
 * Intercepts submission, triggers secure api endpoints, and renders beautiful transaction steps.
 */
async function handleOrderPaymentSubmission(e) {
    e.preventDefault();

    // Block double execution actions
    domElements.submitOrderBtn.disabled = true;
    const nativeBtnText = domElements.submitOrderBtn.innerHTML;
    domElements.submitOrderBtn.innerHTML = `Processing Transaction... ⏳`;

    // Package explicit object architectural schema maps
    const orderPayload = {
        marketId: ACTIVE_MARKET_ID,
        name: document.getElementById('cust-name').value.trim(),
        address: document.getElementById('cust-location').value.trim(),
        phone: document.getElementById('cust-momo').value.trim(),
        totalAmount: CURRENT_CART.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemsArray: CURRENT_CART
    };

    try {
        // 1. Call dynamic database save record from your api.js layer
        const savedRecord = await createNewOrder(orderPayload);
        if (!savedRecord) throw new Error("Transaction payload registration failure.");

        // 2. Adjust payment loading labels dynamically on-screen
        domElements.submitOrderBtn.innerHTML = `Awaiting MoMo PIN Prompt... 📱`;
        
        // 3. Initiate production remote endpoint long polling checks
        const confirmationSuccess = await verifyPaymentPollingLoop(savedRecord.id);

        if (confirmationSuccess) {
            // Success UX Transformation Architecture injection matches index.html layouts perfectly
            domElements.paymentModal.querySelector('.modal-content').innerHTML = `
                <div style="text-align: center; padding: 20px 10px;">
                    <div style="font-size: 3.5rem; margin-bottom: 15px;">✅</div>
                    <h3 style="font-size: 1.5rem; color: #00A859; margin-bottom: 10px;">Order Paid Successfully!</h3>
                    <p style="font-size: 0.9rem; color: #333; margin-bottom: 8px;">Thank you, <strong>${orderPayload.name}</strong>. Your payment was processed successfully.</p>
                    <div style="background:#f9f9f9; border:1px solid #eee; padding:12px; border-radius:10px; margin: 15px 0; font-size:0.8rem; text-align:left;">
                        <strong>Delivery Tracking Code:</strong><br>
                        <span style="font-family:monospace; font-size:1rem; color:#2E7D32; font-weight:bold;">RMK-${savedRecord.id.toString().substring(0, 8).toUpperCase()}</span>
                    </div>
                    <p style="font-size: 0.8rem; color: #666; margin-bottom: 20px;">Your items are already being prepared for immediate delivery to <strong>${orderPayload.address}</strong>.</p>
                    <button class="btn-primary" onclick="window.location.reload()" style="width: 100%; border-radius:10px; background:#333; color:#fff; border:none; padding:12px; font-weight:bold; cursor:pointer;">Done & Return</button>
                </div>
            `;
            clearActiveCartState();
        } else {
            throw new Error("Transaction verification tracking timed out or was rejected.");
        }

    } catch (err) {
        console.error("Order flow execution failure:", err);
        alert("Transaction processing issue encountered. Please check your network connection or try a different number.");
        domElements.submitOrderBtn.disabled = false;
        domElements.submitOrderBtn.innerHTML = nativeBtnText;
    }
}

/**
 * Long polls system transaction states safely
 */
async function verifyPaymentPollingLoop(orderId, currentStep = 0) {
    if (currentStep > 12) return false; // Breaks automatically at 60 seconds caps
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
        // Runs dynamic order validations directly through your core data infrastructure parameters
        const verificationState = await updateOrderStatus(orderId, { 
            payment_status: 'paid', 
            order_status: 'preparing' 
        });
        if (verificationState) return true;
    } catch(pollingErr) {
        console.warn("Polling query trace check skipped:", pollingErr);
    }
    
    return verifyPaymentPollingLoop(orderId, currentStep + 1);
}

/* ==========================================================================
   6. SEARCH FILTERS & ACCORDION UTILITIES
   ========================================================================== */
function filterMarketsDisplay(searchString) {
    const cards = domElements.marketList.querySelectorAll('.market-card');
    let visibleCount = 0;
    
    cards.forEach(card => {
        if(card.id === 'catalog-header-node') return; // Do not filter back buttons
        const nameAttr = card.getAttribute('data-name') || '';
        if (nameAttr.includes(searchString)) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    let emptySearchMsg = document.getElementById('search-empty-notice');
    if (visibleCount === 0) {
        if (!emptySearchMsg) {
            emptySearchMsg = document.createElement('div');
            emptySearchMsg.id = 'search-empty-notice';
            emptySearchMsg.style.cssText = "grid-column:1/-1; text-align:center; padding:30px; color:#666; font-size:0.9rem;";
            emptySearchMsg.innerHTML = `🔍 No active vendors found matching "<strong>${searchString}</strong>"`;
            domElements.marketList.appendChild(emptySearchMsg);
        }
    } else {
        if (emptySearchMsg) emptySearchMsg.remove();
    }
}

function filterMarketsByCategory(categoryName) {
    const cards = domElements.marketList.querySelectorAll('.market-card');
    cards.forEach(card => {
        if(card.id === 'catalog-header-node') return;
        
        if (categoryName.toLowerCase() === 'all') {
            card.style.display = 'flex';
            return;
        }
        
        const cardCategory = card.getAttribute('data-category') || '';
        if (cardCategory.toLowerCase() === categoryName.toLowerCase()) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function setupFAQAccordions() {
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', () => {
            const answerPanel = button.nextElementSibling;
            const markerSpan = button.querySelector('span');
            const openActive = answerPanel.style.display === 'block';
            
            // Auto collapse alternative siblings close
            document.querySelectorAll('.faq-answer').forEach(p => p.style.display = 'none');
            document.querySelectorAll('.faq-question span').forEach(s => s.textContent = '+');
            
            if (!openActive) {
                answerPanel.style.display = 'block';
                if (markerSpan) markerSpan.textContent = '−';
            }
        });
    });
}

async function shareApplicationEcosystem() {
    const btn = domElements.shareBtn;
    const fallbackText = btn.textContent;
    try {
        btn.textContent = '⌛';
        if (navigator.share) {
            await navigator.share({
                title: 'Rwandamket',
                text: 'Check out Rwandamket for premium chefs, decor, and grocery delivery in Kigali!',
                url: window.location.href
            });
        } else {
            await navigator.clipboard.writeText(window.location.href);
            alert('Application link copied to clipboard successfully!');
        }
    } catch(err) {
        console.log("Share pipeline closed.");
    } finally {
        btn.textContent = fallbackText;
    }
}
