/* ==========================================================================
   SUPABASE DATA ACCESS LAYER (API.JS)
   ========================================================================== */

/**
 * Fetches markets from Supabase, filtered by the user's active selected city.
 * Optimized to grab only columns required by the UI layouts.
 * @param {string|null} selectedCity - Optional city name to filter vendors (e.g., 'Kigali')
 * @returns {Promise<Array>} Array of market objects
 */
async function fetchMarketsFromSupabase(selectedCity = null) {
    try {
        // 1. Build the base query layout selective properties
        let query = _supabase
            .from('markets')
            .select('id, name, description, category, image_url, whatsapp_number, momo_number, location'); 

        // 2. Dynamic Location Filtering: Automatically filter using the active user selection state
        if (!selectedCity) {
            selectedCity = localStorage.getItem('user_delivery_city');
        }

        if (selectedCity) {
            query = query.eq('location', selectedCity);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
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
        const { data, error } = await _supabase
            .from('products') 
            .select('id, market_id, name, price, image_url') 
            .eq('market_id', sanitizedId); 

        if (error) throw error;
        return data;
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
    try {
        const { data, error } = await _supabase
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
 * Helper utility to securely update status columns for a specific order entry.
 * Primarily handles payment approvals and processing updates.
 * @param {string} orderId - UUID of the target order row
 * @param {Object} updatesObject - Columns to mutate (e.g., { payment_status: 'paid', transaction_ref: 'PAY-123' })
 * @returns {Promise<boolean>} Status check boolean tracking success
 */
async function updateOrderStatus(orderId, updatesObject) {
    try {
        const { error } = await _supabase
            .from('orders')
            .update(updatesObject)
            .eq('id', orderId);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error(`Failed executing updateOrderStatus on row ${orderId}:`, err.message);
        return false;
    }
}
