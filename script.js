// Mobile Navigation
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(10, 10, 10, 0.98)';
    } else {
        navbar.style.background = 'rgba(10, 10, 10, 0.95)';
    }
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('aos-animate');
        }
    });
}, observerOptions);

// Observe elements with data-aos attribute
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-aos]').forEach(el => {
        observer.observe(el);
    });
});

// Add scroll progress indicator
const scrollProgress = document.createElement('div');
scrollProgress.style.cssText = `
    position: fixed;
    top: 70px;
    left: 0;
    width: 0%;
    height: 3px;
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    z-index: 1000;
    transition: width 0.1s ease;
`;
document.body.appendChild(scrollProgress);

window.addEventListener('scroll', () => {
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (window.scrollY / windowHeight) * 100;
    scrollProgress.style.width = scrolled + '%';
});

// Syntax highlighting for code blocks
function highlightSyntax() {
    document.querySelectorAll('.code-preview code').forEach(block => {
        // Simple syntax highlighting
        const html = block.innerHTML
            .replace(/(".*?")/g, '<span style="color: #e6db74;">$1</span>') // strings
            .replace(/\b(function|return|if|for|while|var|let|const|import|export|from|class|extends)\b/g, 
                     '<span style="color: #66d9ef;">$1</span>') // keywords
            .replace(/\b(true|false|null|undefined)\b/g, 
                     '<span style="color: #ae81ff;">$1</span>') // literals
            .replace(/\b(\d+)\b/g, 
                     '<span style="color: #ae81ff;">$1</span>') // numbers
            .replace(/([\{\}\[\]\(\)])/g, 
                     '<span style="color: #f8f8f2;">$1</span>') // brackets
            .replace(/\b(def|class|import|from|as)\b/g, 
                     '<span style="color: #66d9ef;">$1</span>'); // python keywords
        
        block.innerHTML = html;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    highlightSyntax();
});

// Add Easter egg - Konami code
let konamiCode = '';
const konami = '38384040373937396665';

document.addEventListener('keydown', (e) => {
    konamiCode += e.keyCode;
    if (konamiCode.length > konami.length) {
        konamiCode = konamiCode.substr(konamiCode.length - konami.length);
    }
    if (konamiCode === konami) {
        document.body.style.filter = 'hue-rotate(180deg)';
        setTimeout(() => {
            document.body.style.filter = '';
        }, 3000);
        konamiCode = '';
    }
});
