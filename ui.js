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
        list.innerHTML = ""; // Clear loading
        data.forEach(m => {
            const div = document.createElement('div');
            div.className = 'market-card';
            div.innerHTML = `<h4>${m.name}</h4><p>${m.description}</p>`;
            list.appendChild(div);
        });
    } catch (e) {
        list.innerHTML = "<p>Database connection failed.</p>";
    }
}
