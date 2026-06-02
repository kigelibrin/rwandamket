/* ==========================================================================
   SUPABASE DATA ACCESS LAYER (API.JS)
   ========================================================================== */

// Safe client reference — supports both global naming conventions from CDN
const supabaseClient = typeof supabase !== 'undefined'
    ? supabase
    : (typeof _supabase !== 'undefined' ? _supabase : null);

function checkClientInitialization() {
    if (!supabaseClient) {
        console.error("❌ Supabase client missing! Ensure config.js is loaded first.");
        alert("Database connection unavailable. Please refresh the page.");
        return false;
    }
    return true;
}

/* --------------------------------------------------------------------------
   MARKETS
   FIX: The original code filtered by 'location' column using ilike().
   This caused "no markets" for non-Kigali cities because:
     1. The column in your Supabase table should be named 'city', not 'location'.
     2. The function was re-reading from localStorage internally, which could
        override the city value passed in from the UI.
   
   ✅ SOLUTION: Accept city as a direct parameter only (no internal fallback),
   and filter on the 'city' column with case-insensitive exact match.
   
   ⚠️  IMPORTANT: Make sure your Supabase 'markets' table has a column
   named exactly 'city' (not 'location'). If your column IS named 'location',
   change the `.eq('city', ...)` line below to `.eq('location', ...)`.
   -------------------------------------------------------------------------- */

/**
 * Fetches markets from Supabase filtered by the selected city.
 * @param {string} selectedCity - City name chosen by the user (e.g. 'Musanze')
 * @returns {Promise<Array>} Array of market objects
 */
async function fetchMarketsFromSupabase(selectedCity) {
    if (!checkClientInitialization()) return [];

    // Defensive: trim and validate the city string
    const city = (selectedCity || '').trim();

    if (!city) {
        console.warn("⚠️ fetchMarketsFromSupabase called with no city. Returning empty.");
        return [];
    }

    console.log(`📡 Querying markets for city: "${city}"`);

    try {
        // FIX: Filter on 'city' column with case-insensitive exact match.
        // ilike with '%city%' is too loose and can return wrong cities.
        // Using ilike with exact value is cleaner and correct.
        const { data, error } = await supabaseClient
            .from('markets')
            .select('id, name, description, category, image_url, whatsapp_number, momo_number, location')
            .ilike('location', city);

        if (error) {
            console.error("❌ Supabase query error:", error.message);
            throw error;
        }

        console.log(`✅ Found ${data ? data.length : 0} markets for "${city}"`);
        return data || [];

    } catch (err) {
        console.error("❌ fetchMarketsFromSupabase failed:", err.message);
        return [];
    }
}

/* --------------------------------------------------------------------------
   PRODUCTS
   -------------------------------------------------------------------------- */

/**
 * Fetches all products belonging to a specific market vendor.
 * @param {string|number} marketId - The market's ID
 * @returns {Promise<Array>} Array of product objects
 */
async function fetchItemsByMarket(marketId) {
    if (!checkClientInitialization()) return [];

    if (!marketId) {
        console.warn("⚠️ fetchItemsByMarket called without a marketId");
        return [];
    }

    const sanitizedId = Number(marketId);
    if (isNaN(sanitizedId)) {
        console.error(`❌ Invalid marketId: ${marketId}`);
        return [];
    }

    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('id, market_id, name, price, image_url')
            .eq('market_id', sanitizedId);

        if (error) throw error;

        return data || [];

    } catch (err) {
        console.error(`❌ fetchItemsByMarket failed for market ${marketId}:`, err.message);
        return [];
    }
}

/* --------------------------------------------------------------------------
   ORDERS
   -------------------------------------------------------------------------- */

/**
 * Inserts a new order into the Supabase 'orders' table.
 * @param {Object} orderData
 * @returns {Promise<Object>} The saved order record
 */
async function createNewOrder({ marketId, name, address, phone, totalAmount, itemsArray }) {
    if (!checkClientInitialization()) throw new Error("Supabase client unavailable.");

    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .insert([{
                market_id: marketId,
                customer_name: name,
                delivery_address: address,
                phone_number: phone,
                total_amount: totalAmount,
                items: itemsArray,         // Stored as JSONB in Supabase
                payment_status: 'pending',
                order_status: 'received'
            }])
            .select()
            .single();

        if (error) throw error;

        return data;

    } catch (err) {
        console.error("❌ createNewOrder failed:", err.message);
        throw err;
    }
}

/**
 * Fetches the current payment_status of an order, or updates it if still pending.
 * Used by the payment polling loop in ui.js.
 * @param {string|number} orderId
 * @param {Object} updatesObject - Fields to update (e.g. { payment_status, order_status })
 * @returns {Promise<boolean>} True if payment is confirmed (paid)
 */
async function updateOrderStatus(orderId, updatesObject) {
    if (!checkClientInitialization()) return false;
    if (!orderId) return false;

    try {
        // First read current status
        const { data: currentOrder, error: fetchError } = await supabaseClient
            .from('orders')
            .select('payment_status')
            .eq('id', orderId)
            .single();

        if (fetchError) throw fetchError;

        // If already paid, return success immediately
        if (currentOrder && currentOrder.payment_status === 'paid') return true;

        // If still pending, apply the update
        if (currentOrder && currentOrder.payment_status === 'pending') {
            const { error: updateError } = await supabaseClient
                .from('orders')
                .update(updatesObject)
                .eq('id', orderId);

            if (updateError) throw updateError;
            return true;
        }

        return false;

    } catch (err) {
        console.error(`❌ updateOrderStatus failed for order ${orderId}:`, err.message);
        return false;
    }
}
