// ===== CONSTANTS AND CONFIGURATION =====
const CONFIG = {
    // Demo credentials for login
    DEMO_USERS: {
        'admin@xwork.com': 'admin123',
        'user@xwork.com': 'user123',
        'demo@xwork.com': 'demo123'
    },
    
    // Storage keys
    STORAGE_KEYS: {
        isLoggedIn: 'xwork_logged_in',
        userEmail: 'xwork_user_email',
        userName: 'xwork_user_name',
        rememberMe: 'xwork_remember_me'
    },
    
    // Animation delays
    ANIMATION_DELAYS: {
        short: 300,
        medium: 500,
        long: 1000
    }
};

// ===== UTILITY FUNCTIONS =====
class Utils {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    static showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
            
            // Add error styling to input
            const inputElement = errorElement.previousElementSibling?.querySelector('.form-input');
            if (inputElement) {
                inputElement.classList.add('error');
            }
        }
    }
    
    static hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
            
            // Remove error styling from input
            const inputElement = errorElement.previousElementSibling?.querySelector('.form-input');
            if (inputElement) {
                inputElement.classList.remove('error');
            }
        }
    }
    
    static showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'flex';
            element.classList.add('fade-in');
        }
    }
    
    static hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
            element.classList.remove('fade-in');
        }
    }
    
    static getFromStorage(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.warn('Storage access failed:', error);
            return null;
        }
    }
    
    static setInStorage(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn('Storage write failed:', error);
        }
    }
    
    static removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('Storage remove failed:', error);
        }
    }
}

// ===== AUTHENTICATION MANAGER =====
class AuthManager {
    constructor() {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.init();
    }
    
    init() {
        // Check if user is already logged in
        const isLoggedIn = Utils.getFromStorage(CONFIG.STORAGE_KEYS.isLoggedIn);
        const userEmail = Utils.getFromStorage(CONFIG.STORAGE_KEYS.userEmail);
        
        if (isLoggedIn === 'true' && userEmail) {
            this.isLoggedIn = true;
            this.currentUser = {
                email: userEmail,
                name: Utils.getFromStorage(CONFIG.STORAGE_KEYS.userName) || 'User'
            };
            
            // Redirect to home if on login page
            if (window.location.pathname.includes('login.html')) {
                this.redirectToHome();
            }
        } else {
            // Redirect to login if on home page and not logged in
            if (window.location.pathname.includes('home.html') || 
                (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('home.html'))) {
                this.redirectToLogin();
            }
        }
    }
    
    async login(email, password, rememberMe = false) {
        try {
            // Validate credentials against demo users
            if (CONFIG.DEMO_USERS[email] && CONFIG.DEMO_USERS[email] === password) {
                // Extract name from email
                const name = email.split('@')[0].charAt(0).toUpperCase() + 
                           email.split('@')[0].slice(1).replace('.', ' ');
                
                // Store login state
                Utils.setInStorage(CONFIG.STORAGE_KEYS.isLoggedIn, 'true');
                Utils.setInStorage(CONFIG.STORAGE_KEYS.userEmail, email);
                Utils.setInStorage(CONFIG.STORAGE_KEYS.userName, name);
                
                if (rememberMe) {
                    Utils.setInStorage(CONFIG.STORAGE_KEYS.rememberMe, 'true');
                }
                
                this.isLoggedIn = true;
                this.currentUser = { email, name };
                
                return { success: true, user: this.currentUser };
            } else {
                return { success: false, message: 'Invalid email or password' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'An error occurred during login' };
        }
    }
    
    logout() {
        // Clear storage
        Utils.removeFromStorage(CONFIG.STORAGE_KEYS.isLoggedIn);
        Utils.removeFromStorage(CONFIG.STORAGE_KEYS.userEmail);
        Utils.removeFromStorage(CONFIG.STORAGE_KEYS.userName);
        
        // Keep remember me setting if it was set
        const rememberMe = Utils.getFromStorage(CONFIG.STORAGE_KEYS.rememberMe);
        if (!rememberMe) {
            Utils.removeFromStorage(CONFIG.STORAGE_KEYS.rememberMe);
        }
        
        this.isLoggedIn = false;
        this.currentUser = null;
        
        this.redirectToLogin();
    }
    
    redirectToLogin() {
        window.location.href = 'login.html';
    }
    
    redirectToHome() {
        window.location.href = 'home.html';
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
}

// ===== LOGIN PAGE CONTROLLER =====
class LoginController {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.passwordToggle = document.getElementById('passwordToggle');
        this.rememberMeCheckbox = document.getElementById('rememberMe');
        this.loginButton = document.getElementById('loginBtn');
        
        this.authManager = new AuthManager();
        this.init();
    }
    
    init() {
        if (!this.form) return; // Not on login page
        
        this.setupEventListeners();
        this.initializeLucideIcons();
        this.prefillForm();
    }
    
    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Password toggle
        if (this.passwordToggle) {
            this.passwordToggle.addEventListener('click', () => this.togglePassword());
        }
        
        // Input validation on blur
        if (this.emailInput) {
            this.emailInput.addEventListener('blur', () => this.validateEmail());
            this.emailInput.addEventListener('input', () => Utils.hideError('emailError'));
        }
        
        if (this.passwordInput) {
            this.passwordInput.addEventListener('input', () => Utils.hideError('passwordError'));
        }
        
        // Social login buttons
        const googleBtn = document.querySelector('.google-btn');
        const microsoftBtn = document.querySelector('.microsoft-btn');
        
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleSocialLogin('google'));
        }
        
        if (microsoftBtn) {
            microsoftBtn.addEventListener('click', () => this.handleSocialLogin('microsoft'));
        }
    }
    
    prefillForm() {
        // Prefill email if remember me was checked
        const rememberMe = Utils.getFromStorage(CONFIG.STORAGE_KEYS.rememberMe);
        const savedEmail = Utils.getFromStorage(CONFIG.STORAGE_KEYS.userEmail);
        
        if (rememberMe === 'true' && savedEmail && this.emailInput) {
            this.emailInput.value = savedEmail;
            
            if (this.rememberMeCheckbox) {
                this.rememberMeCheckbox.checked = true;
            }
        }
    }
    
    validateEmail() {
        const email = this.emailInput.value.trim();
        
        if (!email) {
            Utils.showError('emailError', 'Email is required');
            return false;
        }
        
        if (!Utils.validateEmail(email)) {
            Utils.showError('emailError', 'Please enter a valid email address');
            return false;
        }
        
        Utils.hideError('emailError');
        return true;
    }
    
    validatePassword() {
        const password = this.passwordInput.value;
        
        if (!password) {
            Utils.showError('passwordError', 'Password is required');
            return false;
        }
        
        if (password.length < 6) {
            Utils.showError('passwordError', 'Password must be at least 6 characters');
            return false;
        }
        
        Utils.hideError('passwordError');
        return true;
    }
    
    togglePassword() {
        const isPassword = this.passwordInput.type === 'password';
        this.passwordInput.type = isPassword ? 'text' : 'password';
        
        // Update icon
        const icon = this.passwordToggle.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        // Clear previous errors
        Utils.hideError('emailError');
        Utils.hideError('passwordError');
        
        // Validate form
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();
        
        if (!isEmailValid || !isPasswordValid) {
            return;
        }
        
        // Show loading state
        this.setLoadingState(true);
        Utils.showElement('loadingOverlay');
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const email = this.emailInput.value.trim();
            const password = this.passwordInput.value;
            const rememberMe = this.rememberMeCheckbox.checked;
            
            const result = await this.authManager.login(email, password, rememberMe);
            
            if (result.success) {
                // Show success state
                Utils.hideElement('loadingOverlay');
                Utils.showElement('successOverlay');
                
                // Redirect after delay
                setTimeout(() => {
                    this.authManager.redirectToHome();
                }, CONFIG.ANIMATION_DELAYS.medium);
            } else {
                // Show error
                Utils.hideElement('loadingOverlay');
                this.setLoadingState(false);
                
                if (result.message.includes('password')) {
                    Utils.showError('passwordError', result.message);
                } else {
                    Utils.showError('emailError', result.message);
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            Utils.hideElement('loadingOverlay');
            this.setLoadingState(false);
            Utils.showError('passwordError', 'An error occurred. Please try again.');
        }
    }
    
    handleSocialLogin(provider) {
        // Show loading
        Utils.showElement('loadingOverlay');
        
        // Simulate social login
        setTimeout(() => {
            Utils.hideElement('loadingOverlay');
            alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login is not implemented in this demo. Please use the email/password login.`);
        }, 1000);
    }
    
    setLoadingState(isLoading) {
        if (this.loginButton) {
            this.loginButton.disabled = isLoading;
            
            const btnText = this.loginButton.querySelector('.btn-text');
            const btnLoader = this.loginButton.querySelector('.btn-loader');
            
            if (btnText && btnLoader) {
                btnText.style.display = isLoading ? 'none' : 'inline';
                btnLoader.style.display = isLoading ? 'inline-block' : 'none';
            }
        }
        
        // Disable form inputs
        if (this.emailInput) this.emailInput.disabled = isLoading;
        if (this.passwordInput) this.passwordInput.disabled = isLoading;
        if (this.rememberMeCheckbox) this.rememberMeCheckbox.disabled = isLoading;
    }
    
    initializeLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// ===== HOME PAGE CONTROLLER =====
class HomeController {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.profileBtn = document.getElementById('profileBtn');
        this.profileDropdown = document.getElementById('profileDropdown');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.mobileToggle = document.getElementById('mobileToggle');
        this.navMenu = document.getElementById('navMenu');
        
        this.authManager = new AuthManager();
        this.init();
    }
    
    init() {
        if (!this.navbar) return; // Not on home page
        
        this.setupEventListeners();
        this.updateUserInterface();
        this.initializeLucideIcons();
        this.setupScrollEffects();
    }
    
    setupEventListeners() {
        // Profile dropdown toggle
        if (this.profileBtn) {
            this.profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleProfileDropdown();
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            this.closeProfileDropdown();
        });
        
        // Prevent dropdown close when clicking inside
        if (this.profileDropdown) {
            this.profileDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Logout button
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // Mobile menu toggle
        if (this.mobileToggle) {
            this.mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        // Navigation links
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });
        
        // Hero buttons
        const getStartedBtn = document.querySelector('.btn-hero-primary');
        const watchDemoBtn = document.querySelector('.btn-hero-secondary');
        
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', (e) => this.handleGetStarted(e));
        }
        
        if (watchDemoBtn) {
            watchDemoBtn.addEventListener('click', (e) => this.handleWatchDemo(e));
        }
    }
    
    updateUserInterface() {
        const currentUser = this.authManager.getCurrentUser();
        
        if (currentUser) {
            // Update profile name
            const profileName = document.getElementById('profileName');
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');
            
            if (profileName) profileName.textContent = currentUser.name;
            if (userName) userName.textContent = currentUser.name;
            if (userEmail) userEmail.textContent = currentUser.email;
        }
    }
    
    toggleProfileDropdown() {
        if (this.profileDropdown) {
            const isOpen = this.profileDropdown.classList.contains('show');
            
            if (isOpen) {
                this.closeProfileDropdown();
            } else {
                this.openProfileDropdown();
            }
        }
    }
    
    openProfileDropdown() {
        if (this.profileDropdown && this.profileBtn) {
            this.profileDropdown.classList.add('show');
            this.profileBtn.classList.add('active');
        }
    }
    
    closeProfileDropdown() {
        if (this.profileDropdown && this.profileBtn) {
            this.profileDropdown.classList.remove('show');
            this.profileBtn.classList.remove('active');
        }
    }
    
    toggleMobileMenu() {
        if (this.navMenu) {
            this.navMenu.classList.toggle('mobile-open');
        }
    }
    
    handleLogout() {
        // Show confirmation
        if (confirm('Are you sure you want to sign out?')) {
            this.authManager.logout();
        }
    }
    
    handleNavigation(e) {
        e.preventDefault();
        
        // Update active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Smooth scroll to section
        const href = e.target.getAttribute('href');
        if (href.startsWith('#')) {
            const targetSection = document.querySelector(href);
            if (targetSection) {
                targetSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
        
        // Close mobile menu
        if (this.navMenu) {
            this.navMenu.classList.remove('mobile-open');
        }
    }
    
    handleGetStarted(e) {
        e.preventDefault();
        alert('Get Started functionality would integrate with your signup flow!');
    }
    
    handleWatchDemo(e) {
        e.preventDefault();
        alert('Demo video would be displayed here!');
    }
    
    setupScrollEffects() {
        // Navbar scroll effect
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (this.navbar) {
                if (currentScrollY > 100) {
                    this.navbar.classList.add('scrolled');
                } else {
                    this.navbar.classList.remove('scrolled');
                }
            }
            
            lastScrollY = currentScrollY;
        });
        
        // Animate elements on scroll
        this.observeElements();
    }
    
    observeElements() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, observerOptions);
        
        // Observe elements with scroll-animate class
        const animateElements = document.querySelectorAll('.scroll-animate');
        animateElements.forEach(element => {
            observer.observe(element);
        });
    }
    
    initializeLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// ===== GLOBAL FUNCTIONS =====
function handleGetStarted() {
    alert('Get Started functionality would integrate with your signup flow!');
}

function handleWatchDemo() {
    alert('Demo video would be displayed here!');
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize appropriate controller based on current page
    if (document.getElementById('loginForm')) {
        new LoginController();
    } else if (document.getElementById('navbar')) {
        new HomeController();
    }
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Add scroll animations to elements
    addScrollAnimations();
    
    // Setup global event listeners
    setupGlobalEventListeners();
});

// ===== SCROLL ANIMATIONS =====
function addScrollAnimations() {
    const elementsToAnimate = [
        '.feature-card',
        '.solution-card',
        '.pricing-card',
        '.section-header',
        '.hero-stats'
    ];
    
    elementsToAnimate.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element, index) => {
            element.classList.add('scroll-animate');
            element.style.animationDelay = `${index * 0.1}s`;
        });
    });
}

// ===== GLOBAL EVENT LISTENERS =====
function setupGlobalEventListeners() {
    // Handle escape key to close modals/dropdowns
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close any open dropdowns
            const openDropdowns = document.querySelectorAll('.profile-dropdown.show');
            openDropdowns.forEach(dropdown => {
                dropdown.classList.remove('show');
            });
            
            // Close mobile menu
            const mobileMenu = document.querySelector('.nav-menu.mobile-open');
            if (mobileMenu) {
                mobileMenu.classList.remove('mobile-open');
            }
            
            // Close any overlays
            const overlays = document.querySelectorAll('.loading-overlay, .success-overlay');
            overlays.forEach(overlay => {
                if (overlay.style.display !== 'none') {
                    overlay.style.display = 'none';
                }
            });
        }
    });
    
    // Handle form input focus effects
    const formInputs = document.querySelectorAll('.form-input');
    formInputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
        });
    });
    
    // Handle button click effects
    const buttons = document.querySelectorAll('button, .btn, .btn-primary, .btn-secondary');
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Create ripple effect
            createRippleEffect(e, button);
        });
    });
}

// ===== RIPPLE EFFECT =====
function createRippleEffect(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
        z-index: 1;
    `;
    
    // Add ripple animation keyframes if not exists
    if (!document.querySelector('#ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Ensure element has relative positioning
    const position = window.getComputedStyle(element).position;
    if (position !== 'relative' && position !== 'absolute') {
        element.style.position = 'relative';
    }
    
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
}

// ===== PERFORMANCE OPTIMIZATIONS =====
// Debounce function for scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for resize events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== ERROR HANDLING =====
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    
    // Show user-friendly error message for critical errors
    if (e.error && e.error.message) {
        const criticalErrors = ['Network Error', 'Failed to fetch', 'Load failed'];
        const isCritical = criticalErrors.some(error => 
            e.error.message.includes(error)
        );
        
        if (isCritical) {
            showGlobalErrorMessage('Connection error. Please check your internet connection and try again.');
        }
    }
});

function showGlobalErrorMessage(message) {
    // Create or update global error notification
    let errorNotification = document.getElementById('global-error');
    
    if (!errorNotification) {
        errorNotification = document.createElement('div');
        errorNotification.id = 'global-error';
        errorNotification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            max-width: 400px;
            font-size: 14px;
            font-weight: 500;
            animation: slideInRight 0.3s ease-out;
        `;
        document.body.appendChild(errorNotification);
    }
    
    errorNotification.textContent = message;
    errorNotification.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorNotification) {
            errorNotification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (errorNotification.parentNode) {
                    errorNotification.parentNode.removeChild(errorNotification);
                }
            }, 300);
        }
    }, 5000);
}

// ===== ACCESSIBILITY ENHANCEMENTS =====
// Focus management for modals and dropdowns
function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    e.preventDefault();
                }
            }
        }
    });
}

// Announce screen reader messages
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// ===== PROGRESSIVE ENHANCEMENT =====
// Check for JavaScript support and enhance accordingly
if (typeof window !== 'undefined') {
    document.documentElement.classList.add('js-enabled');
    
    // Check for modern browser features
    const supportsIntersectionObserver = 'IntersectionObserver' in window;
    const supportsLocalStorage = (() => {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch (e) {
            return false;
        }
    })();
    
    if (!supportsIntersectionObserver) {
        // Fallback for older browsers
        console.warn('IntersectionObserver not supported, using fallback');
        // Add all scroll-animate elements immediately
        const elements = document.querySelectorAll('.scroll-animate');
        elements.forEach(element => {
            element.classList.add('animate');
        });
    }
    
    if (!supportsLocalStorage) {
        console.warn('localStorage not supported, using session-only storage');
    }
}

// ===== DEMO DATA AND HELPERS =====
const DEMO_DATA = {
    users: [
        {
            email: 'admin@xwork.com',
            password: 'admin123',
            name: 'Admin User',
            role: 'Administrator'
        },
        {
            email: 'user@xwork.com',
            password: 'user123',
            name: 'John Doe',
            role: 'User'
        },
        {
            email: 'demo@xwork.com',
            password: 'demo123',
            name: 'Demo User',
            role: 'Demo'
        }
    ],
    
    features: [
        'AI-Powered Automation',
        'Real-time Collaboration',
        'Advanced Analytics',
        'Secure Cloud Storage',
        'Mobile Applications',
        'API Integration'
    ],
    
    stats: {
        users: '50,000+',
        uptime: '99.9%',
        rating: '4.9/5',
        countries: '120+'
    }
};

// Helper function to get demo credentials
function getDemoCredentials() {
    return DEMO_DATA.users.map(user => ({
        email: user.email,
        password: user.password
    }));
}

// Helper function to show demo credentials
function showDemoCredentials() {
    const credentials = getDemoCredentials();
    const message = `Demo Credentials:\n\n${credentials.map(cred => 
        `Email: ${cred.email}\nPassword: ${cred.password}`
    ).join('\n\n')}`;
    
    alert(message);
}

// Add demo credentials helper to login page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('loginForm')) {
        // Add demo credentials button
        const demoBtn = document.createElement('button');
        demoBtn.type = 'button';
        demoBtn.className = 'demo-credentials-btn';
        demoBtn.textContent = 'Show Demo Credentials';
        demoBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(102, 126, 234, 0.1);
            border: 1px solid rgba(102, 126, 234, 0.3);
            color: #667eea;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 12px;
            cursor: pointer;
            z-index: 1000;
            transition: all 0.3s ease;
        `;
        
        demoBtn.addEventListener('click', showDemoCredentials);
        demoBtn.addEventListener('mouseenter', () => {
            demoBtn.style.background = 'rgba(102, 126, 234, 0.2)';
        });
        demoBtn.addEventListener('mouseleave', () => {
            demoBtn.style.background = 'rgba(102, 126, 234, 0.1)';
        });
        
        document.body.appendChild(demoBtn);
    }
});

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AuthManager,
        LoginController,
        HomeController,
        Utils,
        CONFIG,
        DEMO_DATA
    };
}

// ===== FINAL INITIALIZATION =====
console.log('🚀 Xwork application initialized successfully!');
console.log('📧 Demo credentials available - click "Show Demo Credentials" button');

