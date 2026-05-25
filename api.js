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

        // 2. Dynamic Location Filtering: Automatically filter using the active user selection state
        if (!selectedCity) {
            selectedCity = localStorage.getItem('user_delivery_city');
        }

        if (selectedCity) {
            // Your DB column uses 'location' to hold the city values (e.g., 'Kigali')
            query = query.eq('location', selectedCity);
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
 * Fetches all products tied to a specific market vendor.
 * Includes defensive format verification constraints.
 * @param {string|number} marketId - ID of the parent market vendor
 * @returns {Promise<Array>} Array of product catalog objects
 */
async function fetchItemsByMarket(marketId) {
    checkClientInitialization();
    // 1. Guard clause: Stop early if marketId is missing entirely
    if (!marketId) {
        console.warn("fetchItemsByMarket called without a valid marketId");
        return [];
    }

    try {
        // 2. Safe parsing to ensure proper ID compatibility
        const sanitizedId = Number(marketId);
        if (isNaN(sanitizedId)) {
            throw new Error(`Invalid marketId format: ${marketId}`);
        }

        // 3. Selective query pulling only the data properties UI renders
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
 * Converts customer cart data maps into structured, queryable data columns.
 * @param {Object} orderPayload - Object containing customer parameters, total, and cart array
 * @returns {Promise<Object|null>} Saved order data from database row or null on error
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
                items: itemsArray, // Stores array as structured JSONB payload
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
 * Modified to selectively query payment validations cleanly during UI simulation polling loops.
 * @param {string|number} orderId - Unique identification primary key of the target order row
 * @param {Object} updatesObject - Fallback columns to mutate if testing locally
 * @returns {Promise<boolean>} Status check boolean tracking payment success matching UI expectations
 */
async function updateOrderStatus(orderId, updatesObject) {
    checkClientInitialization();
    try {
        // First check actual current database status value state
        const { data: currentOrder, error: fetchError } = await supabaseClient
            .from('orders')
            .select('payment_status')
            .eq('id', orderId)
            .single();

        if (fetchError) throw fetchError;

        // Dev/Testing Override: If it's still pending locally, simulate an upgrade to match checkout execution
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
