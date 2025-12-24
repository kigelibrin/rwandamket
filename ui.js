<!--Note:The template file will be copied to a new file. When you change the code of the template file you can create new file with this base code. -->
document.addEventListener('DOMContentLoaded', () => {
    const getStartedBtn = document.getElementById('getStartedBtn');
    const navLinks = document.getElementById('navLinks');

    if (getStartedBtn) {
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
    }
});