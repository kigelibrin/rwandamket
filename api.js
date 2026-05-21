/* ==========================================================================
   SUPABASE DATA ACCESS LAYER (API.JS)
   ========================================================================== */

/**
 * Fetches all available markets from Supabase.
 * Optimized to grab only columns required by the UI layouts.
 * @returns {Promise<Array>} Array of market objects
 */
async function fetchMarketsFromSupabase() {
    try {
        // Included momo_number to pass down to dynamic booking UI modals smoothly
        const { data, error } = await _supabase
            .from('markets')
            .select('id, name, description, category, image_url, whatsapp_number, momo_number'); 

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
            .from('products') // Matches Option A table target
            .select('id, market_id, name, price, image_url') 
            .eq('market_id', sanitizedId); 

        if (error) throw error;
        return data;
    } catch (err) {
        console.error(`Error fetching products for market ID ${marketId}:`, err.message);
        return [];
    }
}
