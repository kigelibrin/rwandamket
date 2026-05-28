/* ==========================================================================
   SUPABASE DATA ACCESS LAYER (API.JS)
   ========================================================================== */

// Fallback safety guard in case client initialization used an underscore name variation
const supabaseClient = typeof supabase !== 'undefined' ? supabase : (typeof _supabase !== 'undefined' ? _supabase : null);

function checkClientInitialization() {
    if (!supabaseClient) {
        console.error("Supabase client instance missing! Ensure config.js is loaded and initialized properly.");
        alert("Database connection context unavailable.");
    }
}

/**
 * Fetches markets from Supabase, filtered by the user's active selected city.
 * Optimized to grab only columns required by the UI layouts.
 * @param {string|null} selectedCity - Optional city name to filter vendors (e.g., 'Kigali')
 * @returns {Promise<Array>} Array of market objects
 */
async function fetchMarketsFromSupabase(selectedCity = null) {
    checkClientInitialization();

    try {
        // 1. Build the base query layout selective properties
        let query = supabaseClient
            .from('markets')
            .select('id, name, description, category, image_url, whatsapp_number, momo_number, location');

        // 2. Dynamic Location Filtering
        if (!selectedCity) {
            selectedCity = localStorage.getItem('user_delivery_city');
        }

        if (selectedCity) {
            // Flexible case-insensitive matching
            query = query.ilike('location', `%${selectedCity}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];

    } catch (err) {
        console.error("Error fetching markets from data layer:", err.message);
        return [];
    }
}

/**
 * Cultivates all products tied to a specific market vendor.
 * Includes defensive format verification constraints.
 * @param {string|number} marketId - ID of the parent market vendor
 * @returns {Promise<Array>} Array of product catalog objects
 */
async function fetchItemsByMarket(marketId) {
    checkClientInitialization();

    if (!marketId) {
        console.warn("fetchItemsByMarket called without a valid marketId");
        return [];
    }

    try {
        const sanitizedId = Number(marketId);

        if (isNaN(sanitizedId)) {
            throw new Error(`Invalid marketId format: ${marketId}`);
        }

        const { data, error } = await supabaseClient
            .from('products')
            .select('id, market_id, name, price, image_url')
            .eq('market_id', sanitizedId);

        if (error) throw error;

        return data || [];

    } catch (err) {
        console.error(`Error fetching products for market ID ${marketId}:`, err.message);
        return [];
    }
}

/**
 * Inserts a newly initiated raw order straight into the Supabase database.
 */
async function createNewOrder({ marketId, name, address, phone, totalAmount, itemsArray }) {
    checkClientInitialization();

    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .insert([{
                market_id: marketId,
                customer_name: name,
                delivery_address: address,
                phone_number: phone,
                total_amount: totalAmount,
                items: itemsArray,
                payment_status: 'pending',
                order_status: 'received'
            }])
            .select()
            .single();

        if (error) throw error;

        return data;

    } catch (err) {
        console.error("Critical error inside createNewOrder transaction data layer:", err.message);
        throw err;
    }
}

/**
 * Helper utility to securely fetch or update status columns for a specific order entry.
 */
async function updateOrderStatus(orderId, updatesObject) {
    checkClientInitialization();

    try {
        if (!orderId) return false;

        const { data: currentOrder, error: fetchError } = await supabaseClient
            .from('orders')
            .select('payment_status')
            .eq('id', orderId)
            .single();

        if (fetchError) throw fetchError;

        if (currentOrder && currentOrder.payment_status === 'pending') {

            const { error: updateError } = await supabaseClient
                .from('orders')
                .update(updatesObject)
                .eq('id', orderId);

            if (updateError) throw updateError;

            return true;
        }

        return currentOrder && currentOrder.payment_status === 'paid';

    } catch (err) {
        console.error(`Failed executing updateOrderStatus on row ${orderId}:`, err.message);
        return false;
    }
}

/* ==========================================================================
   AUTOMATED ECOSYSTEM DIAGNOSTIC TESTING SUITE (TEMPORARY)
   ========================================================================== */

async function debugDatabaseConnection() {
    console.log("🚀 Diagnostic Check: Testing direct connection to Supabase...");

    try {
        if (!supabaseClient) {
            console.error("❌ Diagnostic Failed: The supabaseClient instance is entirely missing or initialization failed.");
            return;
        }

        const { data: rawMarkets, error: marketError } = await supabaseClient
            .from('markets')
            .select('*');

        if (marketError) {
            console.error("❌ Supabase Read Access Error:", marketError.message);
            return;
        }

        console.log("✅ Supabase Connection Pipeline: Active and Secure!");
        console.log(`📊 Raw row records detected inside 'markets' table: ${rawMarkets ? rawMarkets.length : 0}`);
        console.log("📦 Data contents extracted:", rawMarkets);

        const activeCityFilter = localStorage.getItem('user_delivery_city') || "Kigali";

        const filteredMarkets = rawMarkets.filter(m =>
            m.location &&
            m.location.toLowerCase().includes(activeCityFilter.toLowerCase())
        );

        console.log(`🔍 Location filter breakdown: Active city tracker is set to [${activeCityFilter}]`);
        console.log(`🎯 Rows matching [${activeCityFilter}] flexibly: ${filteredMarkets.length}`);

        if (rawMarkets.length > 0 && filteredMarkets.length === 0) {
            console.warn("⚠️ Mismatch Alert: You have rows, but NONE of their location columns match the active city filter.");
        }

    } catch (err) {
        console.error("❌ Unexpected execution framework failure:", err.message);
    }
}

// Automatically triggers data logs into browser console 2.5 seconds after load completes
setTimeout(debugDatabaseConnection, 2500);
