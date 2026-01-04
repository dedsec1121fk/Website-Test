document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL STATE ---
    let currentLanguage = 'en';

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
        });

        if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-theme');
        updateThemeButton(document.body.classList.contains('light-theme'));
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
    
    // --- BRAND LOGO (LIGHT/DARK) ---
    function initializeBrandLogo() {
        const logo = document.getElementById('site-logo');
        const apply = () => {
            if (!logo) return;
            const isLight = document.body.classList.contains('light-theme');
            const darkSrc = logo.getAttribute('data-logo-dark');
            const lightSrc = logo.getAttribute('data-logo-light');
            logo.src = isLight ? (lightSrc || logo.src) : (darkSrc || logo.src);
        };
        apply();
        // Keep in sync with theme toggle
        const themeBtn = document.getElementById('nav-theme-switcher');
        themeBtn?.addEventListener('click', () => setTimeout(apply, 0));
        window.addEventListener('storage', (e) => { if (e.key === 'theme') apply(); });
    }

    // --- AUTO-ID HEADINGS (FOR SEARCH + HASH LINKS) ---
    function slugify(text) {
        return (text || '')
            .toLowerCase()
            .trim()
            .replace(/[\u0300-\u036f]/g, '') // accents
            .replace(/[^a-z0-9\u0370-\u03ff\s-]/g, '') // keep greek letters too
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function ensureHeadingIds(root=document) {
        const headings = root.querySelectorAll('h1, h2, h3');
        const used = new Set(Array.from(root.querySelectorAll('[id]')).map(el => el.id));
        headings.forEach(h => {
            if (h.id) return;
            const base = slugify(h.textContent);
            if (!base) return;
            let id = base;
            let i = 2;
            while (used.has(id)) { id = `${base}-${i++}`; }
            h.id = id;
            used.add(id);
        });
    }

    // --- SITE SEARCH (INDEX + OVERLAY) ---
    function initializeSiteSearch() {
        const openBtn = document.getElementById('nav-search');
        const overlay = document.getElementById('site-search-overlay');
        const input = document.getElementById('site-search-input');
        const closeBtn = document.getElementById('site-search-close');
        const resultsEl = document.getElementById('site-search-results');

        if (!openBtn || !overlay || !input || !closeBtn || !resultsEl) return;

        let index = [];
        let indexBuilt = false;

        const getNavPages = () => {
            return Array.from(document.querySelectorAll('.nav-menu .nav-link'))
                .map(a => ({ href: a.getAttribute('href'), title: a.textContent.trim() }))
                .filter(p => p.href);
        };

        const buildIndexFromDoc = (doc, url) => {
            ensureHeadingIds(doc);
            const items = [];
            doc.querySelectorAll('h1, h2, h3, [data-search]').forEach(el => {
                const text = (el.getAttribute('data-search') || el.textContent || '').trim();
                if (!text || text.length < 3) return;
                const id = el.id || '';
                if (!id) return;
                items.push({ text, id, url });
            });
            return items;
        };

        const buildSiteIndex = async () => {
            if (indexBuilt) return index;
            ensureHeadingIds(document);
            const currentUrl = window.location.pathname.split('/').pop() || 'index.html';
            index = buildIndexFromDoc(document, currentUrl);

            const pages = getNavPages();
            const cacheKey = 'dedsec_site_index_v1';
            try {
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length) {
                        // merge current page fresh
                        index = [...parsed.filter(i => i.url !== currentUrl), ...index];
                        indexBuilt = true;
                        return index;
                    }
                }
            } catch {}

            // fetch other pages same-origin (small site)
            for (const p of pages) {
                try {
                    const href = p.href;
                    const samePage = href === currentUrl || href.endsWith('/' + currentUrl);
                    if (samePage) continue;
                    const res = await fetch(href, { cache: 'force-cache' });
                    if (!res.ok) continue;
                    const html = await res.text();
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    index.push(...buildIndexFromDoc(doc, href));
                } catch {}
            }

            // de-dup
            const seen = new Set();
            index = index.filter(item => {
                const key = item.url + '#' + item.id;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            try { sessionStorage.setItem(cacheKey, JSON.stringify(index)); } catch {}
            indexBuilt = true;
            return index;
        };

        const open = async () => {
            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
            document.body.classList.add('no-scroll');
            input.value = '';
            resultsEl.innerHTML = '';
            input.focus();

            // Build index lazily
            await buildSiteIndex();
        };

        const close = () => {
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('no-scroll');
        };

        const render = (items) => {
            resultsEl.innerHTML = '';
            if (!items.length) {
                resultsEl.innerHTML = `<div class="search-empty" data-en="No results." data-gr="Δεν βρέθηκαν αποτελέσματα.">No results.</div>`;
                // keep language consistent
                window.changeLanguage?.(localStorage.getItem('language') || 'en');
                return;
            }
            const frag = document.createDocumentFragment();
            items.slice(0, 12).forEach((it, idx) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'search-result';
                btn.setAttribute('role', 'option');
                btn.innerHTML = `<span class="sr-title">${it.text}</span><span class="sr-meta">${it.url}</span>`;
                btn.addEventListener('click', () => {
                    close();
                    const target = `${it.url}#${it.id}`;
                    const current = (window.location.pathname.split('/').pop() || 'index.html') + window.location.hash;
                    if (target === current) {
                        document.getElementById(it.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                        window.location.href = target;
                    }
                });
                frag.appendChild(btn);
            });
            resultsEl.appendChild(frag);
        };

        const search = (q) => {
            q = (q || '').trim().toLowerCase();
            if (q.length < 2) { resultsEl.innerHTML = ''; return; }
            const hits = index
                .filter(it => it.text.toLowerCase().includes(q))
                .sort((a,b) => a.text.length - b.text.length);
            render(hits);
        };

        openBtn.addEventListener('click', open);
        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('open')) close();
            // Ctrl/Cmd+K to open
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                open();
            }
        });

        input.addEventListener('input', () => search(input.value));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const first = resultsEl.querySelector('.search-result');
                if (first) first.click();
            }
        });
    }

    // --- HASH SCROLL FIX (AFTER AUTO-IDS) ---
    function scrollToHashIfPresent() {
        const hash = window.location.hash;
        if (!hash || hash.length < 2) return;
        const id = decodeURIComponent(hash.slice(1));
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

function init() {
        
        initializeBrandLogo();
        ensureHeadingIds(document);
        initializeSiteSearch();
initializeNavigation();
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
        // After headings get IDs, support deep links
        setTimeout(scrollToHashIfPresent, 50);
});