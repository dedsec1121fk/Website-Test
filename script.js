document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL STATE ---
    let currentLanguage = 'en'; // Set default to English

    // --- NAVIGATION FUNCTIONALITY ---
    function initializeNavigation() {
        const burgerMenu = document.getElementById('burger-menu');
        const navMenu = document.getElementById('nav-menu');
        
        if (burgerMenu && navMenu) {
            burgerMenu.addEventListener('click', () => {
                burgerMenu.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }

        // Close menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (burgerMenu && navMenu) {
                    burgerMenu.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (burgerMenu && navMenu && navMenu.classList.contains('active')) {
                // Check if the click is outside the menu AND outside the burger
                // AND also not on the nav-actions (which are now separate)
                const navActions = document.querySelector('.nav-actions');
                if (!navMenu.contains(e.target) && !burgerMenu.contains(e.target) && !navActions.contains(e.target)) {
                    burgerMenu.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            }
        });
    }

    // --- THEME SWITCHER ---
    function initializeThemeSwitcher() {
        const themeBtn = document.getElementById('nav-theme-switcher');
        const themeIcon = themeBtn?.querySelector('i');
        const themeSpan = themeBtn?.querySelector('span');

        const updateThemeButton = (isLightTheme) => {
            if (!themeBtn || !themeIcon || !themeSpan) return;
            
            if (isLightTheme) {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
                themeSpan.setAttribute('data-en', 'Light Theme');
                themeSpan.setAttribute('data-gr', 'Φωτεινό Θέμα');
            } else {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
                themeSpan.setAttribute('data-en', 'Dark Theme');
                themeSpan.setAttribute('data-gr', 'Σκοτεινό Θέμα');
            }
            themeSpan.textContent = themeSpan.getAttribute(`data-${currentLanguage}`) || themeSpan.getAttribute('data-en');
        };

        themeBtn?.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            updateThemeButton(isLight);
        });

        // Set initial theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        }
        updateThemeButton(document.body.classList.contains('light-theme'));
    }

    // --- LANGUAGE SWITCHER ---
    function initializeLanguageSwitcher() {
        const langBtn = document.getElementById('nav-lang-switcher');
        const disclaimerLangBtn = document.getElementById('disclaimer-lang-btn');
        const langModal = document.getElementById('language-selection-modal');
        
        // MODIFIED: Navigation language button - toggles language immediately
        langBtn?.addEventListener('click', () => {
            const newLang = currentLanguage === 'en' ? 'gr' : 'en';
            changeLanguage(newLang);
        });

        // Language modal buttons (from the now-unused modal) - change language and close
        // This code is no longer triggered by the nav bar, but we leave it
        // as it doesn't cause harm.
        document.querySelectorAll('#language-selection-modal .language-button').forEach(button => {
            button.addEventListener('click', () => {
                const newLang = button.getAttribute('data-lang');
                changeLanguage(newLang);
                langModal?.classList.remove('visible');
            });
        });

        // Disclaimer language button - toggle immediately  
        disclaimerLangBtn?.addEventListener('click', () => {
            const newLang = currentLanguage === 'en' ? 'gr' : 'en';
            changeLanguage(newLang);
        });
    }

    // --- LANGUAGE MANAGEMENT ---
    window.changeLanguage = (lang) => {
        currentLanguage = lang;
        document.documentElement.lang = lang;
        localStorage.setItem('language', lang);
        
        // Update all elements with data attributes
        document.querySelectorAll('[data-en]').forEach(el => {
            const text = el.getAttribute(`data-${lang}`) || el.getAttribute('data-en');
            const hasDirectText = Array.from(el.childNodes).some(node => 
                node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
            );
            
            if (hasDirectText) {
                Array.from(el.childNodes).forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
                        node.textContent = text;
                    }
                });
            } else if (el.children.length === 0) {
                el.textContent = text;
            }
        });

        // Update lang sections
        document.querySelectorAll('[data-lang-section]').forEach(el => {
            el.style.display = el.dataset.langSection === lang ? 'block' : 'none';
            el.classList.toggle('hidden', el.dataset.langSection !== lang);
            if (el.dataset.langSection === lang) {
                el.classList.remove('hidden-by-default');
            }
        });

        // Update navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            const text = link.getAttribute(`data-${lang}`) || link.textContent;
            if (link.getAttribute('data-en')) {
                link.textContent = text;
            }
        });

        // Update navigation action buttons
        document.querySelectorAll('.nav-action-btn span').forEach(span => {
            const text = span.getAttribute(`data-${lang}`) || span.textContent;
            if (span.getAttribute('data-en')) {
                span.textContent = text;
            }
        });

        // Update disclaimer language button
        const disclaimerLangBtn = document.getElementById('disclaimer-lang-btn');
        if (disclaimerLangBtn) {
            const span = disclaimerLangBtn.querySelector('span');
            if (span) {
                const text = span.getAttribute(`data-${lang}`) || span.textContent;
                span.textContent = text;
            }
        }

        // Update feature cards
        document.querySelectorAll('.feature-title, .feature-description, .feature-cta').forEach(el => {
            const text = el.getAttribute(`data-${lang}`) || el.textContent;
            if (el.getAttribute('data-en')) {
                el.textContent = text;
            }
        });

        // Update stats labels
        document.querySelectorAll('.stat-label').forEach(el => {
            const text = el.getAttribute(`data-${lang}`) || el.textContent;
            if (el.getAttribute('data-en')) {
                el.textContent = text;
            }
        });

        // Update product prices and buttons
        document.querySelectorAll('.product-price, .payment-btn').forEach(el => {
            const text = el.getAttribute(`data-${lang}`) || el.textContent;
            if (el.getAttribute('data-en')) {
                el.textContent = text;
            }
        });

        // NEW: Update payment links based on language
        document.querySelectorAll('.payment-btn').forEach(link => {
            const newLink = link.getAttribute(`data-${lang}-link`);
            if (newLink) {
                link.href = newLink;
            }
        });

        // NEW: Update trust indicators
        document.querySelectorAll('.trust-item span').forEach(el => {
            const text = el.getAttribute(`data-${lang}`) || el.textContent;
            if (el.getAttribute('data-en')) {
                el.textContent = text;
            }
        });

        // NEW: Update hero badge
        document.querySelectorAll('.hero-badge span').forEach(el => {
            const text = el.getAttribute(`data-${lang}`) || el.textContent;
            if (el.getAttribute('data-en')) {
                el.textContent = text;
            }
        });

        // NEW: Update hero CTA buttons
        document.querySelectorAll('.hero-cta').forEach(el => {
            const text = el.getAttribute(`data-${lang}`) || el.textContent;
            if (el.getAttribute('data-en')) {
                el.textContent = text;
            }
        });

        // NEW: Update community cards
        document.querySelectorAll('.community-card span').forEach(el => {
            const text = el.getAttribute(`data-${lang}`) || el.textContent;
            if (el.getAttribute('data-en')) {
                el.textContent = text;
            }
        });

        // Update copy button texts
        document.querySelectorAll('.copy-btn').forEach(button => {
            const text = button.textContent;
            if (text === 'Copy' || text === 'Αντιγραφή' || text === 'Copied!' || text === 'Αντιγράφηκε!' || text === 'Error' || text === 'Failed!') {
                if (text === 'Copied!' || text === 'Αντιγράφηκε!') {
                    button.textContent = currentLanguage === 'gr' ? 'Αντιγράφηκε!' : 'Copied!';
                } else if (text === 'Error' || text === 'Failed!') {
                    button.textContent = currentLanguage === 'gr' ? 'Σφάλμα' : 'Error';
                } else {
                    button.textContent = currentLanguage === 'gr' ? 'Αντιγραφή' : 'Copy';
                }
            }
        });
    };

    // --- DISCLAIMER FUNCTIONALITY ---
    function initializeDisclaimer() {
        const disclaimerModal = document.getElementById('disclaimer-modal');
        const acceptBtn = document.getElementById('accept-disclaimer');
        const declineBtn = document.getElementById('decline-disclaimer');

        // Check if user has already accepted the disclaimer
        const disclaimerAccepted = localStorage.getItem('disclaimerAccepted');

        if (!disclaimerAccepted) {
            // Show disclaimer modal immediately on page load
            setTimeout(() => {
                if (disclaimerModal) {
                    // MODIFICATION: Add 'visible' and 'banner-style' classes
                    disclaimerModal.classList.add('visible');
                    disclaimerModal.classList.add('banner-style');
                }
            }, 10);
        }

        // Handle accept button with smoother animation
        acceptBtn?.addEventListener('click', () => {
            // Add closing animation
            disclaimerModal.classList.add('closing');
            
            // Use a slightly longer timeout for smoother animation
            setTimeout(() => {
                localStorage.setItem('disclaimerAccepted', 'true');
                if (disclaimerModal) {
                    // MODIFICATION: Remove 'visible' and 'banner-style' classes
                    disclaimerModal.classList.remove('visible');
                    disclaimerModal.classList.remove('banner-style');
                    disclaimerModal.classList.remove('closing');
                }
                console.log('Disclaimer accepted');
            }, 400); // Increased from 300ms to 400ms for smoother close
        });

        // Handle decline button - go to google.com
        declineBtn?.addEventListener('click', () => {
            // Updated to redirect to google.com
            window.location.href = 'https://www.google.com';
        });

        // MODIFICATION: Removed the click outside prevention logic
        // The modal overlay click listener in initializeModals will handle this.
    }

    // --- MODAL MANAGEMENT ---
    function initializeModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            const closeModalBtn = modal.querySelector('.close-modal');
            const closeModal = () => {
                modal.classList.remove('visible');
            };
            
            modal.addEventListener('click', e => {
                // Check if the target is the modal overlay itself
                // AND if the modal is NOT the disclaimer modal
                if (e.target === modal && modal.id !== 'disclaimer-modal') {
                    closeModal();
                }
            });
            
            closeModalBtn?.addEventListener('click', closeModal);
        });
    }

    // --- CAROUSEL FUNCTIONALITY ---
    function initializeCarousels() {
        // FIX: Updated to use correct class names from collaborations.html
        const carousels = document.querySelectorAll('.collaborations-carousel');
        
        carousels.forEach(carousel => {
            const images = carousel.querySelectorAll('.slide-image');
            const prevBtn = carousel.querySelector('.carousel-nav-btn.prev-btn');
            const nextBtn = carousel.querySelector('.carousel-nav-btn.next-btn');
            
            if (images.length > 0 && prevBtn && nextBtn) {
                let currentIndex = 0;
                
                const showImage = (index) => {
                    images.forEach((img, i) => {
                        img.classList.toggle('active', i === index);
                    });
                };
                
                prevBtn.addEventListener('click', () => {
                    currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
                    showImage(currentIndex);
                });
                
                nextBtn.addEventListener('click', () => {
                    currentIndex = (currentIndex < images.length - 1) ? currentIndex + 1 : 0;
                    showImage(currentIndex);
                });
                
                showImage(0); // Show the first image initially
            }
        });
    }

    // --- IMPROVED COPY FUNCTIONALITY ---
    window.copyToClipboard = (button, targetId) => {
        const codeElement = document.getElementById(targetId);
        if (!codeElement) {
            console.warn('Target element not found for copying.');
            button.textContent = currentLanguage === 'gr' ? 'Σφάλμα' : 'Error';
            setTimeout(() => { 
                button.textContent = currentLanguage === 'gr' ? 'Αντιγραφή' : 'Copy'; 
            }, 1500);
            return;
        }
        
        const originalText = button.textContent;
        const textToCopy = codeElement.textContent || codeElement.innerText;
        
        // Fallback method for older browsers
        const fallbackCopyTextToClipboard = () => {
            const textArea = document.createElement('textarea');
            textArea.value = textToCopy;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                const successful = document.execCommand('copy');
                if (!successful) {
                    throw new Error('Fallback copy command failed');
                }
            } catch (err) {
                console.error('Fallback copy failed:', err);
                throw err;
            } finally {
                document.body.removeChild(textArea);
            }
        };
        
        // Try modern Clipboard API first, then fallback
        const copyPromise = navigator.clipboard 
            ? navigator.clipboard.writeText(textToCopy)
            : new Promise((resolve, reject) => {
                try {
                    fallbackCopyTextToClipboard();
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        
        copyPromise.then(() => {
            // Success feedback
            button.textContent = currentLanguage === 'gr' ? 'Αντιγράφηκε!' : 'Copied!';
            button.style.backgroundColor = 'var(--nm-success, #28a745)';
            button.style.borderColor = 'var(--nm-success, #28a745)';
            button.style.color = 'var(--nm-text-on-status, #ffffff)';
            
            setTimeout(() => { 
                button.textContent = originalText;
                button.style.backgroundColor = '';
                button.style.borderColor = '';
                button.style.color = '';
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy text:', err);
            button.textContent = currentLanguage === 'gr' ? 'Σφάλμα' : 'Error';
            button.style.backgroundColor = 'var(--nm-danger, #dc3545)';
            button.style.borderColor = 'var(--nm-danger, #dc3545)';
            button.style.color = 'var(--nm-text-on-status, #ffffff)';
            
            setTimeout(() => { 
                button.textContent = originalText;
                button.style.backgroundColor = '';
                button.style.borderColor = '';
                button.style.color = '';
            }, 1500);
        });
    };

    // --- TOOL CATEGORIES FUNCTIONALITY (IMPROVED) ---
    function initializeToolCategories(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        console.log(`Initializing tool categories for ${containerSelector}...`);
        
        // First, ensure all categories and tool items are properly initialized
        container.querySelectorAll('.category, .tool-item').forEach(item => {
            if (!item.classList.contains('active')) {
                item.classList.remove('active');
            }
        });
        
        // Category toggle functionality
        container.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', function() {
                const category = this.parentElement;
                const wasActive = category.classList.contains('active');
                
                // If this category was already active, close it
                if (wasActive) {
                    category.classList.remove('active');
                } else {
                    // Close all other categories first
                    container.querySelectorAll('.category').forEach(otherCategory => {
                        if (otherCategory !== category) {
                            otherCategory.classList.remove('active');
                        }
                    });
                    
                    // Open the clicked category
                    category.classList.add('active');
                }
            });
        });
        
        // Tool item toggle functionality with improved animations
        container.querySelectorAll('.tool-header').forEach(header => {
            header.addEventListener('click', function(e) {
                // Prevent the category from closing when clicking on a tool
                e.stopPropagation();
                
                const toolItem = this.parentElement;
                const wasActive = toolItem.classList.contains('active');
                
                // If this tool was already active, close it
                if (wasActive) {
                    toolItem.classList.remove('active');
                } else {
                    // Close all other tool items in the same category
                    const category = toolItem.closest('.category');
                    if (category) {
                        category.querySelectorAll('.tool-item').forEach(otherTool => {
                            if (otherTool !== toolItem) {
                                otherTool.classList.remove('active');
                            }
                        });
                    }
                    
                    // Open the clicked tool item
                    toolItem.classList.add('active');
                }
            });
        });

        // Add keyboard accessibility
        container.querySelectorAll('.category-header, .tool-header').forEach(header => {
            header.setAttribute('tabindex', '0');
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    header.click();
                }
            });
        });
    }

    // --- STORE PAGE FUNCTIONALITY ---
    function initializeStorePage() {
        // Check if we're on the store page
        if (document.querySelector('.store-page')) {
            console.log('Store page detected, initializing store functionality...');
            
            // Initialize store categories (foldable sections)
            initializeStoreCategories();
        }
    }

    // --- STORE CATEGORIES FUNCTIONALITY ---
    function initializeStoreCategories() {
        console.log('Initializing store categories...');
        
        // Store category toggle functionality
        document.querySelectorAll('.store-page .category-header').forEach(header => {
            header.addEventListener('click', function() {
                console.log('Store category header clicked');
                const category = this.parentElement;
                const wasActive = category.classList.contains('active');
                
                // Toggle the clicked category
                if (!wasActive) {
                    category.classList.add('active');
                } else {
                    category.classList.remove('active');
                }
            });
        });
    }

    // --- PERFORMANCE OPTIMIZATION ---
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

    // --- INITIALIZATION ---
    function initializePortfolio() {
        initializeNavigation();
        initializeThemeSwitcher();
        initializeLanguageSwitcher();
        initializeModals();
        initializeCarousels();
        initializeDisclaimer();
        initializeStorePage();

        // Initialize tool categories
        // This targets the main tools page
        initializeToolCategories('.categories-container');
        
        // This targets the FAQ section on the homepage
        initializeToolCategories('#faq-container');

        // Set initial language - default to English
        const savedLanguage = localStorage.getItem('language') || 'en';
        changeLanguage(savedLanguage);

        // Set initial theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        }

        // FIX: Update active nav link based on current page
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-link').forEach(link => {
            // Remove the static 'active' class from HTML
            link.classList.remove('active'); 
            
            const linkPage = link.getAttribute('href').split('/').pop();
            
            if (linkPage === currentPage) {
                link.classList.add('active');
            }
        });

        // Add smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Add animation for elements when they come into view
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements that should animate in
        document.querySelectorAll('.feature-card, .tool-item, .category').forEach(el => {
            observer.observe(el);
        });
    }

    // Initialize the application
    initializePortfolio();

    // Add CSS for animation classes
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            animation: fadeIn 0.6s ease-out forwards;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Improve tool description animation */
        .tool-description {
            transition: max-height 0.4s cubic-bezier(0.65, 0, 0.35, 1), 
                       opacity 0.3s cubic-bezier(0.65, 0, 0.35, 1),
                       padding-top 0.3s cubic-bezier(0.65, 0, 0.35, 1);
        }
        
        /* Improve category animation */
        .tools-list {
            transition: max-height 0.4s cubic-bezier(0.65, 0, 0.35, 1);
        }
    `;
    document.head.appendChild(style);
});