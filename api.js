// api.js - Fetching markets with explicit column selection
async function fetchMarketsFromSupabase() {
    try {
        // Optimization: Replace '*' with the specific columns your market cards actually use
        const { data, error } = await _supabase
            .from('markets')
            .select('id, name, location, image_url'); 

        if (error) throw error;
        return data;
    } catch (err) {
        console.error("Error fetching markets:", err.message);
        return []; 
    }
}

// api.js - Fetching items with robust ID validation
async function fetchItemsByMarket(marketId) {
    // 1. Guard clause: Stop early if marketId is missing entirely
    if (!marketId) {
        console.warn("fetchItemsByMarket called without a valid marketId");
        return [];
    }

    try {
        // 2. Safe parsing: If you are strictly using integer IDs
        const sanitizedId = Number(marketId);
        if (isNaN(sanitizedId)) {
            throw new Error(`Invalid marketId format: ${marketId}`);
        }

        const { data, error } = await _supabase
            .from('products')
            .select('*') // If items table is small, * is okay, but specific columns are always preferred
            .eq('market_id', sanitizedId); 

        if (error) throw error;
        return data;
    } catch (err) {
        console.error("Error fetching products for market:", err.message);
        return [];
    }
}
