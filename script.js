document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL STATE ---
    let currentLanguage = 'en';

    // --- BRAND ASSETS (DO NOT CHANGE LINKS) ---
    const BRAND_LOGOS = {
        dark: 'https://raw.githubusercontent.com/dedsec1121fk/DedSec/main/Extra%20Content/Assets/Images/Logos/Black%20Purple%20Butterfly%20Logo.jpeg',
        light: 'https://raw.githubusercontent.com/dedsec1121fk/DedSec/main/Extra%20Content/Assets/Images/Logos/White%20Purple%20Butterfly%20Logo.jpeg'
    };

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

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                burgerMenu?.classList.remove('active');
                navMenu?.classList.remove('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (navMenu?.classList.contains('active')) {
                const navActions = document.querySelector('.nav-actions');
                if (!navMenu.contains(e.target) && !burgerMenu?.contains(e.target) && !navActions?.contains(e.target)) {
                    burgerMenu?.classList.remove('active');
                    navMenu?.classList.remove('active');
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
                themeIcon.className = 'fas fa-sun';
                themeSpan.setAttribute('data-en', 'Light Theme');
                themeSpan.setAttribute('data-gr', 'Φωτεινό Θέμα');
            } else {
                themeIcon.className = 'fas fa-moon';
                themeSpan.setAttribute('data-en', 'Dark Theme');
                themeSpan.setAttribute('data-gr', 'Σκοτεινό Θέμα');
            }
            themeSpan.textContent = themeSpan.getAttribute(`data-${currentLanguage}`);
        };

        themeBtn?.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            updateThemeButton(isLight);
            updateBranding();
        });

        if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-theme');
        updateThemeButton(document.body.classList.contains('light-theme'));
        updateBranding();
    }

    
    // --- BRANDING (LOGO + FAVICON) ---
    function updateBranding() {
        const isLight = document.body.classList.contains('light-theme');
        const logoUrl = isLight ? BRAND_LOGOS.light : BRAND_LOGOS.dark;

        const logo = document.getElementById('site-logo');
        if (logo) logo.setAttribute('src', logoUrl);

        const favicon = document.getElementById('favicon');
        if (favicon) favicon.setAttribute('href', logoUrl);

        const searchInput = document.getElementById('site-search-input');
        if (searchInput) {
            const ph = searchInput.getAttribute(`data-${currentLanguage}-placeholder`) || searchInput.getAttribute('data-en-placeholder') || '';
            if (ph) searchInput.setAttribute('placeholder', ph);
        }
    }

// --- LANGUAGE MANAGEMENT ---
    window.changeLanguage = (lang) => {
        currentLanguage = lang;
        document.documentElement.lang = lang;
        localStorage.setItem('language', lang);
        
        document.querySelectorAll('[data-en]').forEach(el => {
            const text = el.getAttribute(`data-${lang}`) || el.getAttribute('data-en');
            // Update text while preserving icons/children if they exist
            if (el.children.length === 0) {
                el.textContent = text;
            } else {
                Array.from(el.childNodes).forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
                        node.textContent = text;
                    }
                });
            }
        });

        document.querySelectorAll('[data-lang-section]').forEach(el => {
            const isMatch = el.dataset.langSection === lang;
            el.style.display = isMatch ? 'block' : 'none';
            el.classList.toggle('hidden-by-default', !isMatch);
        });

        // Update Dynamic Links (like Stripe)
        document.querySelectorAll('.payment-btn').forEach(link => {
            const newLink = link.getAttribute(`data-${lang}-link`);
            if (newLink) link.href = newLink;
        });
    };

    // --- UNIVERSAL DISCLAIMER INJECTION ---
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
                    <p><strong>Trademark Disclaimer:</strong> The "DedSec" name and logo used in this project are for thematic and inspirational purposes only. This is an independent, fan-made project created for educational purposes and has no official connection to the "Watch Dogs" franchise. It is not associated with, endorsed by, or affiliated with Ubisoft Entertainment S.A. All trademarks and copyrights for "Watch Dogs" and "DedSec" as depicted in the games belong to their respective owners, Ubisoft Entertainment S.A.</p>
                    <p>This project, including all associated tools, scripts, and documentation ("the Software"), is provided strictly for educational, research, and ethical security testing purposes. It is intended for use exclusively in controlled, authorized environments by users who have obtained explicit, prior written permission from the owners of any systems they intend to test.</p>
                    <p><strong>1. Assumption of Risk and Responsibility:</strong> By accessing or using the Software, you acknowledge and agree that you are doing so at your own risk. You are solely and entirely responsible for your actions and for any consequences that may arise from the use or misuse of this Software. This includes, but is not limited to, compliance with all applicable local, state, national, and international laws and regulations related to cybersecurity, data privacy, and electronic communications.</p>
                    <p><strong>2. Prohibited Activities:</strong> Any use of the Software for unauthorized or malicious activities is strictly prohibited. This includes, without limitation: accessing systems, systems, or data without authorization; performing denial-of-service attacks; data theft; fraud; spreading malware; or any other activity that violates applicable laws. Engaging in such activities may result in severe civil and criminal penalties.</p>
                    <p><strong>3. No Warranty:</strong> The Software is provided "AS IS," without any warranty of any kind, express or implied. This includes, but is not to, the implied warranties of merchantability, fitness for a particular purpose, and non-infringement. The developers and contributors make no guarantee that the Software will be error-free, secure, or uninterrupted.</p>
                    <p><strong>4. Limitation of Liability:</strong> In no event shall the developers, contributors, or distributors of the Software be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connectionwith the Software or the use or other dealings in the Software. This includes any direct, indirect, incidental, special, exemplary, or consequential damages (including, but not to, procurement of substitute goods or services; loss of use, data, or profits; or business interruption).</p>
                    <p><strong>5. No Refund Policy:</strong> All sales are final. Due to the digital nature of our products, we do not offer refunds once a product has been delivered. Please make sure you understand what you're purchasing before completing your order.</p>
                    <p><strong>6. Receipt Delivery:</strong> Please note: Your official payment receipt will be delivered automatically to your email address by Stripe shortly after your purchase. You will need this receipt to contact us for product delivery.</p>
                    <p><strong>7. Payment & Delivery Process:</strong> After completing your payment, you must contact us through our contact page and provide your payment receipt (which you received via email from Stripe). We will then verify your payment and deliver your purchased product(s) as soon as possible. Without contacting us with your receipt, we cannot process your order.</p>
                    <p><strong>8. Payment Disclaimer:</strong> If you have any doubts or questions about our products or payment process, please contact us through our contact page before making a purchase. We're here to help clarify any uncertainties you may have.</p>
                </div>
                <hr class="modal-divider">
                <h3 class="text-center">Privacy Policy Summary</h3>
                <div class="privacy-policy-embed">
                    <p>We are committed to protecting your privacy. We do not store or transmit your personal data. By using our service, you agree to our full Privacy Policy.</p>
                </div>
                <div class="note"><p><strong>By clicking "Accept," you confirm that you have read, understood, and agree to be bound by all the terms and conditions outlined in this disclaimer and our full Privacy Policy. If you do not agree with these terms, you must click "Decline" and cease all use of the Software immediately.</strong></p></div>
              </div>
              <div class="modal-body hidden-by-default" data-lang-section="gr">
                <div class="note">
                    <p><strong>ΠΑΡΑΚΑΛΩ ΔΙΑΒΑΣΤΕ ΠΡΟΣΕΚΤΙΚΑ ΠΡΙΝ ΣΥΝΕΧΙΣΕΤΕ.</strong></p>
                    <p><strong>Αποποίηση Ευθύνης Εμπορικού Σήματος:</strong> Το όνομα και το λογότυπο "DedSec" που χρησιμοποιούνται σε αυτό το έργο είναι μόνο για θεματικούς και εμπνευστικούς σκοπούς. Πρόκειται για ένα ανεξάρτητο, fan-made έργο που δημιουργήθηκε για εκπαιδευτικούς σκοπούς και δεν έχει καμία επίσημη σύνδεση με το franchise "Watch Dogs". Δεν συνδέεται, δεν υποστηρίζεται από, ούτε σχετίζεται με την Ubisoft Entertainment S.A. Όλα τα εμπορικά σήματα και τα πνευματικά δικαιώματα για το "Watch Dogs" και το "DedSec" όπως απεικονίζονται στα παιχνίδια ανήκουν στους αντίστοιχους κατόχους τους, την Ubisoft Entertainment S.A.</p>
                    <p>Αυτό το έργο, συμπεριλαμβανομένων όλων των σχετικών εργαλείων, σεναρίων και τεκμηρίωσης («το Λογισμικό»), παρέχεται αυστηρά για εκπαιδευτικούς, ερευνητικούς και ηθικούς σκοπούς δοκιμών ασφαλείας. Προορίζεται για χρήση αποκλειστικά σε ελεγχόμενα, εξουσιοδοτημένα περιβάλλοντα από χρήστες που έχουν λάβει ρητή, προηγούμενη γραπτή άδεια από τους ιδιοκτήτες οποιωνδήποτε συστημάτων σκοπεύουν να δοκιμάσουν.</p>
                    <p><strong>1. Ανάληψη Κινδύνου και Ευθύνης:</strong> Με την πρόσβαση ή τη χρήση του Λογισμικού, αναγνωρίζετε και συμφωνείτε ότι το κάνετε με δική σας ευθύνη. Είστε αποκλειστικά και εξ ολοκλήρου υπεύθυνοι για τις ενέργειές σας και για τυχόν συνέπειες που μπορεί να προκύψουν από τη χρήση ή κακή χρήση αυτού του Λογισμικού. Αυτό περιλαμβάνει, ενδεικτικά, τη συμμόcompliance με όλους τους ισχύοντες τοπικούς, πολιτειακούς, εθνικούς και διεθνείς νόμους και κανονισμούς που σχετίζονται με την κυβερνοασφάλεια, την προστασία δεδομένων και τις ηλεκτρονικές επικοινωνίες.</p>
                    <p><strong>2. Απαγορευμένες Δραστηριότητες:</strong> Απαγορεύεται αυστηρά οποιαδήποτε χρήση του Λογισμικού για μη εξουσιοδοτημένες ή κακόβουλες δραστηριότητες. Αυτό περιλαμβάνει, χωρίς περιορισμό: πρόσβαση σε συστήματα ή δεδομένα χωρίς εξουσιοδοτημένη πρόσβαση, εκτέλεση επιθέσεων άρνησης υπηρεσίας (denial-of-service), κλοπή δεδομένων, απάτη, διάδοση κακόβουλου λογισμικού ή οποιαδήποτε άλλη δραστηριότητα που παραβιάζει την ισχύουσα νομοθεσία. Η συμμετοχή σε τέτοιες δραστηριότητες μπορεί να οδηγήσει σε σοβαρές αστικές και ποινικές κυρώσεις.</p>
                    <p><strong>3. Καμία Εγγύηση:</strong> Το Λογισμικό παρέχεται "ΩΣ ΕΧΕΙ", χωρίς καμία εγγύηση οποιουδήποτε είδους, ρητή ή σιωπηρή. Αυτό περιλαμβάνει, ενδεικτικά, τις σιωπηρές εγγυήσεις εμπορευσιμότητας, καταλληλότητας για συγκεκριμένο σκοπό και μη παραβίασης. Οι προγραμματιστές και οι συντελεστές δεν παρέχουν καμία εγγύηση ότι το Λογισμικό θα είναι απαλλαγμένο από σφάλματα, ασφαλές ή αδιάλειπτο.</p>
                    <p><strong>4. Περιορισμός Ευθύνης:</strong> Σε καμία περίπτωση οι προγραμματιστές, οι συντελεστές ή οι διανομείς του Λογισμικού δεν φέρουν ευθύνη για οποιαδήποτε αξίμη, ζημιές ή άλλη ευθύνη, είτε πρόκειται για αγωγή σύμβασης, αδικοπραξίας ή άλλως, που προκύπτει από, ή σε σχέση με το Λογισμικό ή τη χρήση ή άλλες συναλλαγές με το Λογισμικό. Αυτό περιλαμβάνει τυχόν άμεσες, έμμεσες, τυχαίες, ειδικές, παραδειγματικές ή επακόλουθες ζημιές (συμπεριλαμβανομένης, αλλά όχι μόνο, της προμήθειας υποκατάστατων αγαθών ή υπηρεσιών, απώλειας χρήσης, δεδομένων ή κερδών ή διακοπής εργασιών).</p>
                    <p><strong>5. Πολιτική Χωρίς Επιστροφή Χρημάτων:</strong> Όλες οι πωλήσεις είναι οριστικές. Λόγω της ψηφιακής φύσης των προϊόντων μας, δεν προσφέρουμε επιστροφή χρημάτων αφού παραδοθεί ένα προϊόν. Παρακαλούμε βεβαιωθείτε ότι καταλαβαίνετε τι αγοράζετε πριν ολοκληρώσετε την παραγγελία σας.</p>
                    <p><strong>6. Παράδοση Απόδειξης:</strong> Παρακαλούμε σημειώστε: Η επίσημη απόδειξη πληρωμής σας θα παραδοθεί αυτόματα στη διεύθυνση email σας από το Stripe λίγο μετά την αγορά σας. Θα χρειαστείτε αυτήν την απόδειξη για να επικοινωνήσετε μαζί μας για την παράδοση του προϊόντος.</p>
                    <p><strong>7. Διαδικασία Πληρωμής & Παράδοσης:</strong> Μετά την ολοκλήρωση της πληρωμής σας, πρέπει να επικοινωνήσετε μαζί μας μέσω της σελίδας επικοινωνίας και να μας δώσετε την απόδειξη πληρωμής σας (την οποία λάβατε μέσω email από το Stripe). Στη συνέχεια, θα επαληθεύσουμε την πληρωμή σας και θα σας παραδώσουμε το αγορασμένο προϊόν(τα) το συντομότερο δυνατό. Χωρίς να επικοινωνήσετε μαζί μας με την απόδειξή σας, δεν μπορούμε να επεξεργαστούμε την παραγγελία σας.</p>
                    <p><strong>8. Αποποίηση Ευθύνης Πληρωμής:</strong> Εάν έχετε οποιεσδήποτε αμφιβολίες ή ερωτήσεις σχετικά με τα προϊόντα μας ή τη διαδικασία πληρωμής, παρακαλούμε επικοινωνήστε μαζί μας μέσω της σελίδας επικοινωνίας πριν από οποιαδήποτε αγορά. Είμαστε εδώ για να διευκρινίσουμε οποιεσδήποτε αβεβαιότητες μπορεί να έχετε.</p>
                </div>
                <hr class="modal-divider">
                <h3 class="text-center">Περίληψη Πολιτικής Απορήτου</h3>
                <div class="privacy-policy-embed">
                    <p>Δεσμευόμαστε να προστατεύουμε το απόρρητό σας. Δεν αποθηκεύουμε ή μεταδίδουμε τα προσωπικά σας δεδομένα. Με τη χρήση της υπηρεσίας μας, συμφωνείτε με την πλήρη Πολιτική Απορρήτου μας.</p>
                </div>
                <div class="note"><p><strong>Με το κλικ στο "Αποδοχή", επιβεβαιώνετε ότι διαβάσατε, κατανοήσατε και συμφωνείτε να δεσμεύεστε από όλους τους όρους και τις προϋποθέσεις που περιγράφονται σε αυτήν την αποποίηση ευθύνης και την πλήρη Πολιτική Απορρήτου μας. Εάν δεν συμφωνείτε με αυτούς τους όρους, πρέπει να κάνετε κλικ στο "Απόρριψη" και να διακόψετε αμέσως κάθε χρήση του Λογισμικού.</strong></p></div>
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
        if (localStorage.getItem('disclaimerAccepted') === 'true') return;

        injectDisclaimerHTML();
        
        const modal = document.getElementById('disclaimer-modal');
        const langBtn = document.getElementById('disclaimer-lang-btn');
        
        setTimeout(() => {
            modal?.classList.add('visible', 'banner-style');
            window.changeLanguage(currentLanguage); // Sync language
        }, 100);

        langBtn?.addEventListener('click', () => {
            window.changeLanguage(currentLanguage === 'en' ? 'gr' : 'en');
        });

        document.getElementById('accept-disclaimer')?.addEventListener('click', () => {
            modal.classList.add('closing');
            setTimeout(() => {
                localStorage.setItem('disclaimerAccepted', 'true');
                modal.classList.remove('visible', 'banner-style', 'closing');
            }, 400);
        });

        document.getElementById('decline-disclaimer')?.addEventListener('click', () => {
            window.location.href = 'https://www.google.com';
        });
    }

    // --- SHARED UTILITIES (COPY, CAROUSEL, ACCORDION) ---
    window.copyToClipboard = (button, targetId) => {
        const text = document.getElementById(targetId)?.innerText;
        if (!text) return;
        
        navigator.clipboard.writeText(text).then(() => {
            const original = button.textContent;
            button.textContent = currentLanguage === 'gr' ? 'Αντιγράφηκε!' : 'Copied!';
            button.classList.add('copy-success');
            setTimeout(() => { 
                button.textContent = original;
                button.classList.remove('copy-success');
            }, 1500);
        });
    };

    function initializeToolCategories(selector) {
        const container = document.querySelector(selector);
        if (!container) return;
        container.querySelectorAll('.category-header').forEach(h => h.addEventListener('click', () => h.parentElement.classList.toggle('active')));
        container.querySelectorAll('.tool-header').forEach(h => h.addEventListener('click', (e) => { e.stopPropagation(); h.parentElement.classList.toggle('active'); }));
    }

    function initializeCarousels() {
        document.querySelectorAll('.collaborations-carousel').forEach(c => {
            const imgs = c.querySelectorAll('.slide-image');
            let idx = 0;
            c.querySelector('.prev-btn')?.addEventListener('click', () => { idx = (idx > 0) ? idx - 1 : imgs.length - 1; show(); });
            c.querySelector('.next-btn')?.addEventListener('click', () => { idx = (idx < imgs.length - 1) ? idx + 1 : 0; show(); });
            const show = () => imgs.forEach((img, i) => img.classList.toggle('active', i === idx));
            show();
        });
    }

    // --- MAIN INIT ---
    
    // --- SITE SEARCH ---
    function slugify(text) {
        return (text || '').toLowerCase()
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9\u0370-\u03ff]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .slice(0, 64);
    }

    function ensureId(el, prefix='sec') {
        if (!el) return '';
        if (el.id) return el.id;
        const base = slugify(el.textContent) || prefix;
        let id = base;
        let i = 2;
        while (document.getElementById(id)) { id = `${base}-${i++}`; }
        el.id = id;
        return id;
    }

    function buildSearchIndex() {
        const items = [];

        // Primary navigation (cross-page)
        document.querySelectorAll('a.nav-link[href]').forEach(a => {
            const title = (a.getAttribute(`data-${currentLanguage}`) || a.textContent || '').trim();
            const href = a.getAttribute('href');
            if (!href || !title) return;
            items.push({ title, href, badge: currentLanguage === 'gr' ? 'Σελίδα' : 'Page' });
        });

        // In-page sections (headings + key cards)
        const selectors = [
            'main h1','main h2','main h3',
            '.feature-card .feature-title',
            '.category-header h2',
            '.tool-item .tool-title',
            '.faq-buttons-container a',
            '.carousel-slide h3',
            '.contact-grid h3'
        ];

        document.querySelectorAll(selectors.join(',')).forEach(el => {
            const rawTitle = (el.getAttribute(`data-${currentLanguage}`) || el.textContent || '').trim();
            if (!rawTitle || rawTitle.length < 3) return;

            const container = el.closest('.tool-item, .feature-card, .category, .faq-buttons-container, section, .carousel-slide, .contact-grid') || el;
            const id = ensureId(container, 'section');
            if (!id) return;
            items.push({ title: rawTitle, href: `#${id}`, badge: currentLanguage === 'gr' ? 'Ενότητα' : 'Section' });
        });

        const seen = new Set();
        return items.filter(it => (it.href && !seen.has(it.href) && seen.add(it.href)));
    }

    function scoreMatch(q, title) {
        const t = (title || '').toLowerCase();
        if (t === q) return 100;
        if (t.startsWith(q)) return 80;
        if (t.includes(q)) return 60;
        const words = q.split(/\s+/).filter(Boolean);
        let hits = 0;
        words.forEach(w => { if (t.includes(w)) hits += 1; });
        return hits ? 40 + hits * 5 : 0;
    }

    function initializeSiteSearch() {
        const openBtn = document.getElementById('nav-search-btn');
        const modal = document.getElementById('site-search-modal');
        const input = document.getElementById('site-search-input');
        const resultsEl = document.getElementById('site-search-results');
        const clearBtn = document.getElementById('site-search-clear');

        if (!openBtn || !modal || !input || !resultsEl) return;

        let index = [];
        let isOpen = false;

        const render = (list, q) => {
            resultsEl.innerHTML = '';

            if (!q) {
                const hint = document.createElement('div');
                hint.className = 'search-result';
                hint.style.cursor = 'default';
                hint.innerHTML = `
                    <div>
                        <div class="search-result-title">${currentLanguage === 'gr' ? 'Δοκίμασε να ψάξεις:' : 'Try searching for:'}</div>
                        <div class="search-result-meta">${currentLanguage === 'gr' ? 'Termux, εργαλεία, εγκατάσταση, FAQ…' : 'Termux, tools, installation, FAQ…'}</div>
                    </div>
                    <div class="search-result-badge">${currentLanguage === 'gr' ? 'Συμβουλή' : 'Tip'}</div>
                `;
                resultsEl.appendChild(hint);
                return;
            }

            if (!list.length) {
                const empty = document.createElement('div');
                empty.className = 'search-result';
                empty.style.cursor = 'default';
                empty.innerHTML = `
                    <div>
                        <div class="search-result-title">${currentLanguage === 'gr' ? 'Δεν βρέθηκαν αποτελέσματα' : 'No results found'}</div>
                        <div class="search-result-meta">${currentLanguage === 'gr' ? 'Δοκίμασε άλλη λέξη.' : 'Try a different keyword.'}</div>
                    </div>
                    <div class="search-result-badge">0</div>
                `;
                resultsEl.appendChild(empty);
                return;
            }

            list.slice(0, 10).forEach(it => {
                const row = document.createElement('div');
                row.className = 'search-result';
                row.setAttribute('role', 'button');
                row.tabIndex = 0;
                row.innerHTML = `
                    <div>
                        <div class="search-result-title">${it.title}</div>
                        <div class="search-result-meta">${it.href.startsWith('#') ? (currentLanguage === 'gr' ? 'Σε αυτή τη σελίδα' : 'On this page') : it.href}</div>
                    </div>
                    <div class="search-result-badge">${it.badge}</div>
                `;
                row.addEventListener('click', () => openResult(it.href));
                row.addEventListener('keydown', (e) => { if (e.key === 'Enter') openResult(it.href); });
                resultsEl.appendChild(row);
            });
        };

        const openModal = () => {
            modal.hidden = false;
            document.body.style.overflow = 'hidden';
            isOpen = true;
            index = buildSearchIndex();
            updateBranding();
            input.value = '';
            if (clearBtn) clearBtn.hidden = true;
            render([], '');
            setTimeout(() => input.focus(), 10);
        };

        const closeModal = () => {
            modal.hidden = true;
            document.body.style.overflow = '';
            isOpen = false;
        };

        const openResult = (href) => {
            closeModal();
            if (!href) return;
            if (href.startsWith('#')) {
                const el = document.getElementById(href.slice(1));
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.replaceState(null, '', href);
            } else {
                window.location.href = href;
            }
        };

        const filter = () => {
            const q = input.value.trim().toLowerCase();
            if (clearBtn) clearBtn.hidden = !q;
            const list = q ? index
                .map(it => ({ ...it, _score: scoreMatch(q, it.title) }))
                .filter(it => it._score > 0)
                .sort((a,b) => b._score - a._score) : [];
            render(list, q);
        };

        openBtn.addEventListener('click', openModal);
        modal.querySelectorAll('[data-close-search]').forEach(el => el.addEventListener('click', closeModal));
        document.addEventListener('keydown', (e) => { if (isOpen && e.key === 'Escape') closeModal(); });

        input.addEventListener('input', filter);
        clearBtn?.addEventListener('click', () => { input.value=''; filter(); input.focus(); });

        // Live language placeholders
        const originalChangeLanguage = window.changeLanguage;
        window.changeLanguage = (lang) => {
            originalChangeLanguage(lang);
            index = buildSearchIndex();
            updateBranding();
            if (isOpen) filter();
        };
    }

function init() {
        initializeNavigation();
        initializeSiteSearch();
        initializeThemeSwitcher();
        initializeCarousels();
        initializeToolCategories('.categories-container');
        initializeToolCategories('#faq-container');
        
        // Language Switcher (Navbar)
        document.getElementById('nav-lang-switcher')?.addEventListener('click', () => {
            window.changeLanguage(currentLanguage === 'en' ? 'gr' : 'en');
        });

        // Modals
        document.querySelectorAll('.modal-overlay').forEach(m => {
            m.addEventListener('click', (e) => { if(e.target === m && m.id !== 'disclaimer-modal') m.classList.remove('visible'); });
            m.querySelector('.close-modal')?.addEventListener('click', () => m.classList.remove('visible'));
        });

        // Final Setup
        window.changeLanguage(localStorage.getItem('language') || 'en');
        initializeDisclaimer();

        // Active Link
        const page = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href').includes(page)));

        // Reveal Animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('animate-in'); observer.unobserve(e.target); }});
        });
        document.querySelectorAll('.feature-card, .tool-item, .category').forEach(el => observer.observe(el));
    }

    init();
});