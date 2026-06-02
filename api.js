/* ==========================================================================
   SUPABASE DATA ACCESS LAYER (API.JS)
   ========================================================================== */

// Uses the initialized client from config.js
// config.js must be loaded before this file (it is, per index.html script order)
function getClient() {
    return window._supabase || null;
}

function checkClientInitialization() {
    if (!getClient()) {
        console.error("❌ Supabase client missing! Ensure config.js is loaded first.");
        return false;
    }
    return true;
}

/* --------------------------------------------------------------------------
   MARKETS
   Filters on 'location' column (confirmed column name in your Supabase table)
   -------------------------------------------------------------------------- */
async function fetchMarketsFromSupabase(selectedCity) {
    if (!checkClientInitialization()) return [];

    const city = (selectedCity || '').trim();
    if (!city) {
        console.warn("⚠️ fetchMarketsFromSupabase called with no city.");
        return [];
    }

    console.log(`📡 Querying markets for city: "${city}"`);

    try {
        const { data, error } = await getClient()
            .from('markets')
            .select('id, name, description, category, image_url, whatsapp_number, momo_number, location')
            .ilike('location', city);

        if (error) throw error;

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
        const { data, error } = await getClient()
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
async function createNewOrder({ marketId, name, address, phone, totalAmount, itemsArray }) {
    if (!checkClientInitialization()) throw new Error("Supabase client unavailable.");

    try {
        const { data, error } = await getClient()
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
        console.error("❌ createNewOrder failed:", err.message);
        throw err;
    }
}

async function updateOrderStatus(orderId, updatesObject) {
    if (!checkClientInitialization()) return false;
    if (!orderId) return false;

    try {
        const { data: currentOrder, error: fetchError } = await getClient()
            .from('orders')
            .select('payment_status')
            .eq('id', orderId)
            .single();

        if (fetchError) throw fetchError;
        if (currentOrder && currentOrder.payment_status === 'paid') return true;

        if (currentOrder && currentOrder.payment_status === 'pending') {
            const { error: updateError } = await getClient()
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
