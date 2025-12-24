document.addEventListener('DOMContentLoaded', () => {
    const getStartedBtn = document.getElementById('getStartedBtn');
    // Using querySelector to find the class '.nav-links' 
    // This is safer as it matches your current HTML class
    const navLinks = document.querySelector('.nav-links');

    if (getStartedBtn && navLinks) {
        getStartedBtn.addEventListener('click', () => {
            // Toggle the dropdown
            navLinks.classList.toggle('active');
            
            // Change button text for better UX
            if (navLinks.classList.contains('active')) {
                getStartedBtn.textContent = 'Close';
            } else {
                getStartedBtn.textContent = 'Get Started';
            }
        });

        // Professional touch: Close menu when a link is clicked
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                getStartedBtn.textContent = 'Get Started';
            });
        });
    }
});
