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

        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        }
        updateThemeButton(document.body.classList.contains('light-theme'));
    }

    // --- LANGUAGE SWITCHER ---
    function initializeLanguageSwitcher() {
        const langBtn = document.getElementById('nav-lang-switcher');
        
        langBtn?.addEventListener('click', () => {
            const newLang = currentLanguage === 'en' ? 'gr' : 'en';
            changeLanguage(newLang);
        });

        // Handle dynamically injected disclaimer language button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#disclaimer-lang-btn')) {
                const newLang = currentLanguage === 'en' ? 'gr' : 'en';
                changeLanguage(newLang);
            }
        });
    }

    // --- LANGUAGE MANAGEMENT ---
    window.changeLanguage = (lang) => {
        currentLanguage = lang;
        document.documentElement.lang = lang;
        localStorage.setItem('language', lang);
        
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

        document.querySelectorAll('[data-lang-section]').forEach(el => {
            el.style.display = el.dataset.langSection === lang ? 'block' : 'none';
            el.classList.toggle('hidden', el.dataset.langSection !== lang);
            if (el.dataset.langSection === lang) {
                el.classList.remove('hidden-by-default');
            }
        });

        // Update nav, features, stats, products, trust items, etc.
        const selectors = [
            '.nav-link', '.nav-action-btn span', '.feature-title', 
            '.feature-description', '.feature-cta', '.stat-label', 
            '.product-price', '.payment-btn', '.trust-item span', 
            '.hero-badge span', '.hero-cta', '.community-card span'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                const text = el.getAttribute(`data-${lang}`) || el.textContent;
                if (el.getAttribute('data-en')) {
                    el.textContent = text;
                }
            });
        });

        document.querySelectorAll('.payment-btn').forEach(link => {
            const newLink = link.getAttribute(`data-${lang}-link`);
            if (newLink) link.href = newLink;
        });

        document.querySelectorAll('.copy-btn').forEach(button => {
            const text = button.textContent;
            if (['Copy', 'Αντιγραφή', 'Copied!', 'Αντιγράφηκε!', 'Error', 'Failed!'].includes(text)) {
                if (text === 'Copied!' || text === 'Αντιγράφηκε!') {
                    button.textContent = lang === 'gr' ? 'Αντιγράφηκε!' : 'Copied!';
                } else if (text === 'Error' || text === 'Failed!') {
                    button.textContent = lang === 'gr' ? 'Σφάλμα' : 'Error';
                } else {
                    button.textContent = lang === 'gr' ? 'Αντιγραφή' : 'Copy';
                }
            }
        });
    };

    // --- UNIVERSAL DISCLAIMER INJECTION & LOGIC ---
    function injectDisclaimerHTML() {
        if (document.getElementById('disclaimer-modal')) return;

        const modalHTML = `
        <div id="disclaimer-modal" class="modal-overlay">
          <div class="modal-content">
              <div class="modal-header">
                <h2 data-en="Disclaimer & Terms of Use" data-gr="Αποποίηση Ευθύνης & Όροι Χρήσης">Disclaimer & Terms of Use</h2>
                <button id="disclaimer-lang-btn" class="language-selection-btn">
                    <i class="fas fa-globe"></i>
                    <span data-en="Change Language" data-gr="Αλλαγή Γλώσσας">Change Language</span>
                </button>
              </div>
              <div class="modal-body" data-lang-section="en">
                <div class="note">
                    <p><strong>PLEASE READ CAREFULLY BEFORE PROCEEDING.</strong></p>
                    <p><strong>Trademark Disclaimer:</strong> The "DedSec" name and logo used in this project are for thematic and inspirational purposes only. This is an independent, fan-made project created for educational purposes and has no official connection to the "Watch Dogs" franchise...</p>
                    <p><strong>1. Assumption of Risk and Responsibility:</strong> By accessing or using the Software, you acknowledge and agree that you are doing so at your own risk...</p>
                    <p><strong>2. Prohibited Activities:</strong> Any use of the Software for unauthorized or malicious activities is strictly prohibited...</p>
                </div>
                <hr class="modal-divider">
                <h3 class="text-center">Privacy Policy Summary</h3>
                <div class="privacy-policy-embed">
                    <p>We are committed to protecting your privacy. We do not store or transmit your personal data.</p>
                </div>
              </div>
              <div class="modal-body hidden-by-default" data-lang-section="gr">
                <div class="note">
                    <p><strong>ΠΑΡΑΚΑΛΩ ΔΙΑΒΑΣΤΕ ΠΡΟΣΕΚΤΙΚΑ ΠΡΙΝ ΣΥΝΕΧΙΣΕΤΕ.</strong></p>
                    <p><strong>Αποποίηση Ευθύνης Εμπορικού Σήματος:</strong> Το όνομα και το λογότυπο "DedSec" είναι μόνο για θεματικούς και εμπνευστικούς σκοπούς...</p>
                    <p><strong>1. Ανάληψη Κινδύνου και Ευθύνης:</strong> Με την πρόσβαση ή τη χρήση του Λογισμικού, αναγνωρίζετε ότι το κάνετε με δική σας ευθύνη...</p>
                </div>
                <hr class="modal-divider">
                <h3 class="text-center">Περίληψη Πολιτικής Απορήτου</h3>
                <div class="privacy-policy-embed">
                    <p>Δεσμευόμαστε να προστατεύουμε το απόρρητό σας. Δεν αποθηκεύουμε ή μεταδίδουμε τα προσωπικά σας δεδομένα.</p>
                </div>
              </div>
              <div class="modal-footer disclaimer-footer">
                <button id="decline-disclaimer" class="decline-btn" data-en="Decline" data-gr="Απόρριψη">Decline</button>
                <button id="accept-disclaimer" class="accept-btn" data-en="Accept" data-gr="Αποδοχή">Accept</button>
              </div>
          </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    function initializeDisclaimer() {
        const disclaimerAccepted = localStorage.getItem('disclaimerAccepted');
        if (disclaimerAccepted) return;

        // Ensure modal exists on current page
        injectDisclaimerHTML();
        
        const disclaimerModal = document.getElementById('disclaimer-modal');
        const acceptBtn = document.getElementById('accept-disclaimer');
        const declineBtn = document.getElementById('decline-disclaimer');

        setTimeout(() => {
            if (disclaimerModal) {
                disclaimerModal.classList.add('visible');
                disclaimerModal.classList.add('banner-style');
                // Ensure correct language is showing in the newly injected modal
                window.changeLanguage(currentLanguage);
            }
        }, 100);

        acceptBtn?.addEventListener('click', () => {
            disclaimerModal.classList.add('closing');
            setTimeout(() => {
                localStorage.setItem('disclaimerAccepted', 'true');
                disclaimerModal.classList.remove('visible');
                disclaimerModal.classList.remove('closing');
            }, 400);
        });

        declineBtn?.addEventListener('click', () => {
            window.location.href = 'https://www.google.com';
        });
    }

    // --- MODAL MANAGEMENT ---
    function initializeModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            const closeModalBtn = modal.querySelector('.close-modal');
            modal.addEventListener('click', e => {
                if (e.target === modal && modal.id !== 'disclaimer-modal') {
                    modal.classList.remove('visible');
                }
            });
            closeModalBtn?.addEventListener('click', () => modal.classList.remove('visible'));
        });
    }

    // --- CAROUSEL FUNCTIONALITY ---
    function initializeCarousels() {
        document.querySelectorAll('.collaborations-carousel').forEach(carousel => {
            const images = carousel.querySelectorAll('.slide-image');
            const prevBtn = carousel.querySelector('.prev-btn');
            const nextBtn = carousel.querySelector('.next-btn');
            
            if (images.length > 0 && prevBtn && nextBtn) {
                let currentIndex = 0;
                const showImage = (index) => {
                    images.forEach((img, i) => img.classList.toggle('active', i === index));
                };
                prevBtn.addEventListener('click', () => {
                    currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
                    showImage(currentIndex);
                });
                nextBtn.addEventListener('click', () => {
                    currentIndex = (currentIndex < images.length - 1) ? currentIndex + 1 : 0;
                    showImage(currentIndex);
                });
                showImage(0);
            }
        });
    }

    // --- COPY FUNCTIONALITY ---
    window.copyToClipboard = (button, targetId) => {
        const codeElement = document.getElementById(targetId);
        if (!codeElement) return;
        
        const originalText = button.textContent;
        const textToCopy = codeElement.textContent || codeElement.innerText;
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            button.textContent = currentLanguage === 'gr' ? 'Αντιγράφηκε!' : 'Copied!';
            button.classList.add('copy-success');
            setTimeout(() => { 
                button.textContent = originalText;
                button.classList.remove('copy-success');
            }, 1500);
        });
    };

    // --- CATEGORIES & STORE ---
    function initializeToolCategories(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        container.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', () => {
                const category = header.parentElement;
                category.classList.toggle('active');
            });
        });

        container.querySelectorAll('.tool-header').forEach(header => {
            header.addEventListener('click', (e) => {
                e.stopPropagation();
                header.parentElement.classList.toggle('active');
            });
        });
    }

    // --- INITIALIZATION ---
    function initializePortfolio() {
        initializeNavigation();
        initializeThemeSwitcher();
        initializeLanguageSwitcher();
        initializeModals();
        initializeCarousels();
        initializeDisclaimer(); // Now works on all pages
        
        initializeToolCategories('.categories-container');
        initializeToolCategories('#faq-container');

        const savedLanguage = localStorage.getItem('language') || 'en';
        window.changeLanguage(savedLanguage);

        // Update active nav link
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href').split('/').pop() === currentPage);
        });

        // Animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.feature-card, .tool-item, .category').forEach(el => observer.observe(el));
    }

    initializePortfolio();

    // Style injection for animations
    const style = document.createElement('style');
    style.textContent = `
        .animate-in { animation: fadeIn 0.6s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .copy-success { background-color: var(--nm-success, #28a745) !important; color: white !important; }
    `;
    document.head.appendChild(style);
});