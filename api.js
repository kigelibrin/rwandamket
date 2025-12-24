// api.js - Defining the Rwandamket Ecosystem

const marketsData = [
    {
        id: 'home-decor',
        name: 'RWANDAMKET Home Decor',
        description: 'Premium Rwandan craftsmanship, from hand-woven baskets to modern interior art.',
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80',
        whatsapp: '250786979388' // Replace with your actual number
    },
    {
        id: 'events-mgmt',
        name: 'RWANDAMKET Events Management',
        description: 'Professional planning, decor, and coordination for weddings and corporate events.',
        image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=400&q=80',
        whatsapp: '250786979388'
    },
    {
        id: 'food-menu',
        name: 'RWANDAMKET Menu',
        description: 'Exquisite foods and drinks delivered fresh from our kitchen to your table.',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
        whatsapp: '250786979388'
    },
    {
        id: 'professional-chefs',
        name: 'RWANDAMKET Chefs',
        description: 'Hire world-class private chefs for your home or special intimate gatherings in Kigali.',
        image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
        whatsapp: '250786979388'
    }
];

// Function to "get" the markets to other files
function getMarkets() {
    return marketsData;
}
