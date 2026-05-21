// config.js - Keep this file out of your main logic tracking
const supabaseUrl = 'https://bulxwiknhwafvfzodheb.supabase.co';
const supabaseKey = 'sb_publishable_G5SGumxFBV1Ju2kFFYupXA_NNLyhL83';

// Expose the client globally for ui.js to read securely
window._supabase = supabase.createClient(supabaseUrl, supabaseKey);
