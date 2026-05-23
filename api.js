/* ==========================================================================
   SUPABASE DATA ACCESS LAYER (API.JS)
   ========================================================================== */

/**
 * Fetches markets from Supabase, optionally filtered by a specific city/location.
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

        // 2. Dynamic Location Filtering: If a city is active, narrow database return rows instantly
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
