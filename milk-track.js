// Milk Tracking Portal Functions

// Open login modal
function openMilkPortal() {
    document.getElementById('milk-login-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close login modal
function closeMilkPortal() {
    document.getElementById('milk-login-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Handle login
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Simple demo authentication
    if (email === 'admin@milktrack.com' && password === 'admin123') {
        // Store login session
        localStorage.setItem('milktrack_user', JSON.stringify({
            email: email,
            name: 'Admin User',
            loginTime: new Date().toISOString()
        }));
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } else {
        alert('Invalid credentials! Use:\nEmail: admin@milktrack.com\nPassword: admin123');
    }
    
    return false;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('milk-login-modal');
    if (event.target === modal) {
        closeMilkPortal();
    }
}

// Close modal on Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeMilkPortal();
    }
});
