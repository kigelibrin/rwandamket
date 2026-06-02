// config.js
const supabaseUrl = 'https://bulxwiknhwafvfzodheb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bHh3aWtuaHdhZnZmem9kaGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Nzc1ODUsImV4cCI6MjA4MjM1MzU4NX0.WcEwx0wUkfOr2DgaztIXqdKfnYfK6ERsumGuLblF_kI';

window._supabase = supabase.createClient(supabaseUrl, supabaseKey);

// TEMPORARY DEBUG — remove after fixing
window._supabase
    .from('markets')
    .select('id, name, location')
    .then(({ data, error }) => {
        if (error) {
            alert('❌ Supabase Error: ' + error.message);
        } else if (!data || data.length === 0) {
            alert('⚠️ Connected but 0 rows returned from markets table.');
        } else {
            alert('✅ ' + data.length + ' markets found!\n\n' + data.map(m => m.name + ' → ' + m.location).join('\n'));
        }
    });
