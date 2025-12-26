// 1. Alert errors on iPhone
window.onerror = function(msg) { alert(msg); };

document.addEventListener('DOMContentLoaded', () => {
    // 2. Button logic first (So it works immediately!)
    const btn = document.getElementById('getStartedBtn');
    const links = document.querySelector('.nav-links');

    if (btn && links) {
        btn.onclick = () => {
            links.classList.toggle('active');
            btn.textContent = links.classList.contains('active') ? 'Close' : 'Get Started';
        };
    }

    // 3. Load database data
    if (typeof fetchMarketsFromSupabase === 'function') {
        renderMarkets();
    }
});

async function renderMarkets() {
    const list = document.getElementById('market-list');
    try {
        const data = await fetchMarketsFromSupabase();
        if (!data || data.length === 0) {
            list.innerHTML = "<p>Add a row in Supabase!</p>";
            return;
        }
        
        list.innerHTML = ""; // Clear the loading text
        
        data.forEach(m => {
            const div = document.createElement('div');
            div.className = 'market-card';
            
            // This is the HTML for the card
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px; width:100%;">
                    <img src="${m.image_url}" style="width:70px; height:70px; border-radius:12px; object-fit:cover;">
                    <div style="flex:1;">
                        <h4 style="color:var(--primary); margin-bottom:4px;">${m.name}</h4>
                        <p style="font-size:0.8rem; color:#666; line-height:1.3;">${m.description}</p>
                    </div>
                </div>
            `;

            // --- THE CLICK LOGIC ---
            div.onclick = () => {
                // Remove any non-numbers from the phone string (like spaces)
                const cleanNum = m.whatsapp_number.replace(/\D/g, ''); 
                const message = encodeURIComponent(`Hello! I'm interested in ${m.name}. Could you give me more information?`);
                
                // Open WhatsApp
                window.open(`https://wa.me/${cleanNum}?text=${message}`, '_blank');
            };

            list.appendChild(div);
        });
    } catch (e) {
        list.innerHTML = "<p>Database connection failed.</p>";
    }
}
