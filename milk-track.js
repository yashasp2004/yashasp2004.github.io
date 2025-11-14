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
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Check if Firebase is initialized
    const useFirebase = typeof firebase !== 'undefined' && 
                       typeof firebaseConfig !== 'undefined' && 
                       firebaseConfig.apiKey !== "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
    
    if (useFirebase) {
        // Firebase authentication
        try {
            const result = await firebaseLogin(email, password);
            if (result.success) {
                // Store login session
                localStorage.setItem('milktrack_user', JSON.stringify({
                    email: result.user.email,
                    name: result.user.displayName || email.split('@')[0],
                    loginTime: new Date().toISOString(),
                    uid: result.user.uid
                }));
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                alert('Login failed: ' + result.error + '\n\nMake sure you created this account in Firebase Console → Authentication');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    } else {
        // Demo mode authentication (fallback when Firebase not configured)
        if (email === 'admin@milktrack.com' && password === 'admin123') {
            // Store login session
            localStorage.setItem('milktrack_user', JSON.stringify({
                email: email,
                name: 'Admin User (Demo)',
                loginTime: new Date().toISOString(),
                demo: true
            }));
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            alert('Invalid credentials!\n\nDemo mode:\nEmail: admin@milktrack.com\nPassword: admin123\n\nOr configure Firebase in firebase-config.js');
        }
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
