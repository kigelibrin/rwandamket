// config.js
const supabaseUrl = 'https://bulxwiknhwafvfzodheb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bHh3aWtuaHdhZnZmem9kaGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Nzc1ODUsImV4cCI6MjA4MjM1MzU4NX0.WcEwx0wUkfOr2DgaztIXqdKfnYfK6ERsumGuLblF_kI';

window._supabase = supabase.createClient(supabaseUrl, supabaseKey);
