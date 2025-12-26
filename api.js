// api.js - Talking to the real database
async function fetchMarketsFromSupabase() {
    try {
        // This line asks Supabase for everything in the 'markets' table
        const { data, error } = await _supabase
            .from('markets')
            .select('*');

        if (error) throw error;
        return data;
    } catch (err) {
        console.error("Error fetching markets:", err.message);
        return []; // Return empty if there is an error
    }
}
