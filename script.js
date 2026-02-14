/* ============================================================================
   MAINTENANCE (DedSec Project)
   - Theme + language persistence is handled here (localStorage).
   - If assets break on sub-pages, check SITE_BASE resolver at the top.
   - NAV highlights & mobile menu behaviors are also here.
   ============================================================================ */
document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL STATE ---
    let currentLanguage = 'en';


    // --- NAV WORD STACK + MENU OFFSET (keeps navbar compact so logo stays visible) ---
    const applyNavbarWordStack = () => {
        // Only for the navbar action labels (not the site title). We don't want to affect normal body text.
        const targets = document.querySelectorAll(
            '.main-nav .nav-action-label, .main-nav .burger-label'
        );

        const stackTextNodes = (root) => {
            try {
                const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                    acceptNode: (node) => (node.nodeValue && node.nodeValue.trim().length ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
                });
                const nodes = [];
                while (walker.nextNode()) nodes.push(walker.currentNode);
                nodes.forEach(node => {
                    const raw = (node.nodeValue || '').trim();
                    if (/\s+/.test(raw)) node.nodeValue = raw.split(/\s+/).join('\n');
                });
            } catch (_) {
                // Fallback: do nothing
            }
        };

        targets.forEach(stackTextNodes);
    };

    const syncNavMenuOffset = () => {
        const nav = document.querySelector('.main-nav');
        const menu = document.getElementById('nav-menu');
        if (!nav || !menu) return;
        const h = Math.ceil(nav.getBoundingClientRect().height || 70);
        menu.style.top = `${h}px`;
        menu.style.height = `calc(100vh - ${h}px)`;
    };


    // --- BRAND ASSETS (Theme-aware) ---
    // IMPORTANT (GitHub Pages + subpages):
    // Any relative URL like "Assets/..." breaks on pages like /Pages/faq.html
    // because it resolves to /Pages/Assets/... (404). We resolve assets from the
    // actual location of script.js so it works everywhere (root domain, /repo/, etc.).
    const SITE_BASE = (() => {
        const scriptEl = document.querySelector('script[src$="script.js"], script[src*="/script.js"], script[src*="script.js?"]');
        try {
            if (scriptEl?.src) return new URL('./', scriptEl.src).href;
        } catch (_) {}
        // Fallback: best-effort
        return new URL('./', window.location.href).href;
    })();

    const assetUrl = (path) => {
        const clean = (path || '').replace(/^\/+/, '');
        return new URL(clean, SITE_BASE).href;
    };

    const LOGO_DARK = assetUrl('Assets/Images/Logos/Black%20Purple%20Butterfly%20Logo.jpeg');
    const LOGO_LIGHT = assetUrl('Assets/Images/Logos/White%20Purple%20Butterfly%20Logo.jpeg');

    const getThemeLogo = () => (document.body.classList.contains('light-theme') ? LOGO_LIGHT : LOGO_DARK);

    const applyThemeAssets = () => {
        const url = getThemeLogo();

        // Navbar logo (injected into title)
        document.querySelectorAll('.nav-title h1 img[data-site-logo="1"]').forEach(img => {
            if (img.src !== url) img.src = url;
        });

        // Favicon fallback (helps when some subpages have broken relative paths)
        const icon = document.querySelector('link[rel="icon" i]') || document.querySelector('link[rel="shortcut icon" i]');
        if (icon) icon.href = url;
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
        if (!themeBtn) return;

        // Restore saved theme
        if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-theme');

        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            if (typeof applyThemeAssets === 'function') applyThemeAssets();
        });
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

        // Sync search UI language
        if (typeof window.__updateSearchLanguage === 'function') {
            window.__updateSearchLanguage();
        }

        // Keep the navbar compact (so the injected logo doesn't get clipped)
        applyNavbarWordStack();
        syncNavMenuOffset();
    };

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

    
    // --- SITE SEARCH (IN-PAGE + CROSS-PAGE LINKS) ---
    function initializeSearch() {
        // Inject button (nav) + modal once
        const navActions = document.querySelector('.nav-actions');
        if (navActions && !document.getElementById('nav-search')) {
            const btn = document.createElement('button');
            btn.id = 'nav-search';
            btn.className = 'nav-action-btn';
            btn.setAttribute('type', 'button');
            btn.innerHTML = `
                <i class="fas fa-magnifying-glass"></i>
                <span data-en="Search" data-gr="Αναζήτηση">Search</span>
            `;
            navActions.prepend(btn);
        }

        if (!document.getElementById('search-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'search-overlay';
            overlay.className = 'search-overlay';
            overlay.innerHTML = `
                <div class="search-modal" role="dialog" aria-modal="true" aria-labelledby="search-title">
                    <div class="search-top">
                        <input id="search-input" class="search-input" type="search" autocomplete="off" spellcheck="false"
                            placeholder="Search the site..."
                            aria-label="Search the site" />
                        <button id="search-close" class="search-close" type="button" aria-label="Close search">
                            <i class="fas fa-xmark"></i>
                        </button>
                    </div>
                    <div class="search-results" id="search-results" role="listbox" aria-label="Search results"></div>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        const overlay = document.getElementById('search-overlay');
        const input = document.getElementById('search-input');
        const resultsEl = document.getElementById('search-results');
        const closeBtn = document.getElementById('search-close');
        const openBtn = document.getElementById('nav-search');

        if (!overlay || !input || !resultsEl || !closeBtn || !openBtn) return;

        const slugify = (str) => {
            return (str || '')
                .toLowerCase()
                .trim()
                .replace(/['"`]/g, '')
                .replace(/[^a-z0-9\u0370-\u03ff]+/g, '-') // keep Greek
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 64) || 'section';
        };

        
        const SEARCH_VERSION = '2026-01-27-v8';
        const SEARCH_STORAGE_KEY = `dedsec_search_index_${SEARCH_VERSION}`;
        const SEARCH_PAGES_STORAGE_KEY = `dedsec_search_pages_${SEARCH_VERSION}`;

        // Pages we always want searchable (static, always exist).
        const BASE_PAGES = [
            "index.html",
            "Pages/learn-about-the-tools.html",
            "Pages/guide-for-installation.html",
            "Pages/faq.html",
            "Pages/store.html",
            "Pages/collaborations.html",
            "Pages/portfolio-github-info.html",
            "Pages/contact-credits.html",
            "Pages/privacy-policy.html",        ];
        const loadStoredPagesList = () => {
            try {
                const raw = localStorage.getItem(SEARCH_PAGES_STORAGE_KEY);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                if (!Array.isArray(parsed) || parsed.length < 5) return null;
                return parsed;
            } catch (_) {
                return null;
            }
        };

        const storePagesList = (pages) => {
            try {
                localStorage.setItem(SEARCH_PAGES_STORAGE_KEY, JSON.stringify(pages));
            } catch (_) {
                // ignore
            }
        };

        const detectGitHubRepoFromLocation = () => {
            const host = String(location.hostname || '').toLowerCase();
            if (!host.endsWith('github.io')) return null;

            const owner = host.split('.')[0];
            const parts = String(location.pathname || '').split('/').filter(Boolean);

            // User/organization site: https://owner.github.io/  => repo is owner.github.io
            // Project site:          https://owner.github.io/repo/ => repo is the first path segment
            const repo = parts.length ? parts[0] : `${owner}.github.io`;
            return { owner, repo };
        };

        const loadSiteConfig = async () => {
            // site-config.json is at the site root
            try {
                const url = new URL('site-config.json', SITE_BASE).href;
                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) throw new Error('config fetch failed');
                const cfg = await res.json();
                return cfg || {};
            } catch (_) {
                return {};
            }
        };

        const fetchRepoBlogFiles = async ({ owner, repo, branch, blogDir }) => {
            const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(blogDir)}`;
            const withRef = branch ? `${base}?ref=${encodeURIComponent(branch)}` : base;

            let res = await fetch(withRef, {
                headers: { Accept: 'application/vnd.github+json' },
                cache: 'no-store'
            });

            // If the branch is wrong (common when copying to a new repo), retry without ref.
            if (!res.ok && branch) {
                res = await fetch(base, {
                    headers: { Accept: 'application/vnd.github+json' },
                    cache: 'no-store'
                });
            }

            if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);

            const data = await res.json();
            if (!Array.isArray(data)) return [];
            return data
                .filter((x) => x && x.type === 'file' && /\.html?$/i.test(x.name))
                .map((x) => String(x.name));
        };

        let cachedPagesList = loadStoredPagesList();
        let pagesListPromise = null;

        const getSearchPagesAsync = async () => {
            if (cachedPagesList) return cachedPagesList;
            if (pagesListPromise) return pagesListPromise;

            pagesListPromise = (async () => {
                let pages = [...BASE_PAGES];
// Normalize + dedupe
                const seen = new Set();
                pages = pages
                    .map(p => String(p || '').replace(/^\/+/, ''))
                    .filter(Boolean)
                    .filter(p => {
                        if (seen.has(p)) return false;
                        seen.add(p);
                        return true;
                    });

                cachedPagesList = pages;
                storePagesList(pages);
                return pages;
            })();

            return pagesListPromise;
        };

        const toFetchUrl = (path) => {
            try { return new URL((path || '').replace(/^\/+/, ''), SITE_BASE).href; } catch (_) { return path; }
        };
const ensureDeterministicIds = (doc) => {
            const scope = doc.querySelector('main') || doc.body;
            if (!scope) return;
            const candidates = scope.querySelectorAll('h1, h2, h3, h4, .feature-title, .tool-title, .category-header');
            const used = new Map();

            candidates.forEach((el) => {
                const raw = (el.getAttribute('data-en') || el.textContent || '').trim();
                if (!raw) return;

                // If the element already has an ID, keep it.
                if (el.id) {
                    used.set(el.id, true);
                    return;
                }

                const base = slugify(raw);
                let unique = base;
                let n = 2;
                while (used.has(unique) || doc.getElementById(unique)) {
                    unique = `${base}-${n++}`;
                }
                el.id = unique;
                used.set(unique, true);
            });
        };

        const currentPagePath = () => {
            const parts = window.location.pathname.split('/').filter(Boolean);
            const file = (parts.pop() || 'index.html');
            // Works on root domains AND project pages like /repo/Pages/... because we don't assume depth.
            if (parts.includes('Pages')) return `Pages/${file}`;
return file;
        };

        const buildPageItems = (doc, pagePath) => {
            ensureDeterministicIds(doc);

            const pageTitle = (doc.querySelector('title')?.textContent || '').trim();
            const label =
                pageTitle ||
                pagePath
                    .replace(/^Pages\//, '')
                    .replace(/\.html$/i, '')
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, (m) => m.toUpperCase());

            const scope = doc.querySelector('main') || doc.body;
            const candidates = scope ? scope.querySelectorAll('h1, h2, h3, h4, .feature-title, .tool-title, .category-header') : [];
            const items = [];

            candidates.forEach((el) => {
                const en = (el.getAttribute('data-en') || '').trim();
                const gr = (el.getAttribute('data-gr') || '').trim();
                const fallback = (el.textContent || '').trim();

                const display = (currentLanguage === 'gr' ? (gr || en || fallback) : (en || gr || fallback)).trim();
                if (!display || display.length < 3) return;

                const keywords = [fallback, en, gr].filter(Boolean).join(' ').toLowerCase();
                const hash = el.id ? `#${el.id}` : '';

                items.push({
                    title_en: (en || fallback).trim(),
                    title_gr: (gr || en || fallback).trim(),
                    title: (en || gr || fallback).trim(),
                    meta: label,
                    url: `${pagePath}${hash}`,
                    keywords
                });
});

            return items;
        };

        const loadStoredIndex = () => {
            try {
                const raw = localStorage.getItem(SEARCH_STORAGE_KEY);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                if (!Array.isArray(parsed) || parsed.length < 10) return null;
                return parsed;
            } catch (_) {
                return null;
            }
        };

        const storeIndex = (items) => {
            try {
                localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(items));
            } catch (_) {
                // ignore
            }
        };

        let cachedIndex = loadStoredIndex();
        let buildingPromise = null;

        const buildIndexAsync = async () => {
            if (cachedIndex) return cachedIndex;
            if (buildingPromise) return buildingPromise;

            buildingPromise = (async () => {
                // Always include current page first (fast)
                ensureDeterministicIds(document);
                const items = buildPageItems(document, currentPagePath());

                const current = currentPagePath();
                const allPages = await getSearchPagesAsync();
                const others = allPages.filter(p => p !== current);

                const fetchOne = async (path) => {
                    const res = await fetch(toFetchUrl(path), { cache: 'force-cache' });
                    if (!res.ok) throw new Error(`Fetch failed: ${path}`);
                    const html = await res.text();
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    return buildPageItems(doc, path);
                };

                const settled = await Promise.allSettled(others.map(fetchOne));
                settled.forEach((r) => {
                    if (r.status === 'fulfilled' && Array.isArray(r.value)) items.push(...r.value);
                });

                // Deduplicate by URL
                const seen = new Set();
                const deduped = items.filter(it => {
                    if (!it || !it.url) return false;
                    if (seen.has(it.url)) return false;
                    seen.add(it.url);
                    return true;
                });

                cachedIndex = deduped;
                storeIndex(deduped);
                return deduped;
            })();

            return buildingPromise;
        };
;

        const setOverlayVisible = (visible) => {
            overlay.classList.toggle('visible', visible);
            document.body.style.overflow = visible ? 'hidden' : '';
            if (visible) {
                // Build the full site index (across all pages) on first open
                buildIndexAsync().catch(() => {});
                input.focus({ preventScroll: true });
                input.select();
                renderResults(input.value.trim());
            }
        };

        const resolveUrl = (url) => {
            if (!url) return '';
            if (url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('tel:')) return url;
            if (url.startsWith('#')) return url;
            try {
                return new URL(url.replace(/^\/+/, ''), SITE_BASE).href;
            } catch (_) {
                return url;
            }
        };

        const navigate = (url) => {
            let target;
            try {
                if (url && url.startsWith('#')) {
                    const base = window.location.href.split('#')[0];
                    target = new URL(base + url);
                } else {
                    target = new URL((url || '').replace(/^\/+/, ''), SITE_BASE);
                }
            } catch (_) {
                window.location.href = url;
                return;
            }

            const current = new URL(window.location.href);
            if (target.pathname === current.pathname && target.hash) {
                const id = target.hash.replace('#', '');
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.location.hash = target.hash;
            } else {
                window.location.href = target.href;
            }
        };

        const pageNameForNav = () => (window.location.pathname.split('/').pop() || 'index.html');

        const renderResults = async (query) => {
            const q = (query || '').toLowerCase();
            resultsEl.setAttribute('aria-busy', 'true');
            const index = await buildIndexAsync();
            resultsEl.removeAttribute('aria-busy');

            if (!q) {
                resultsEl.innerHTML = `
                    <a class="search-item" href="${resolveUrl('index.html')}" role="option">
                        <div class="search-item-title"><i class="fas fa-house"></i><span>Home</span></div>
                        <div class="search-item-meta">Tip: press <span style="opacity:.9">/</span> or <span style="opacity:.9">Ctrl+K</span> to search</div>
                    </a>
                `;
                return;
            }

            const hits = index
                .filter(it => it.keywords.includes(q) || ((currentLanguage === 'gr' ? (it.title_gr || it.title || '') : (it.title_en || it.title || '')).toLowerCase().includes(q)))
                .slice(0, 20);

            if (!hits.length) {
                resultsEl.innerHTML = `
                    <div class="search-item" role="option" tabindex="0">
                        <div class="search-item-title"><i class="fas fa-circle-info"></i><span>${currentLanguage === 'gr' ? 'Δεν βρέθηκαν αποτελέσματα' : 'No results found'}</span></div>
                        <div class="search-item-meta">${currentLanguage === 'gr' ? 'Δοκιμάστε άλλη λέξη ή λιγότερους όρους.' : 'Try a different word or fewer terms.'}</div>
                    </div>
                `;
                return;
            }

            resultsEl.innerHTML = hits.map(it => `
                <a class="search-item" href="${resolveUrl(it.url)}" role="option">
                    <div class="search-item-title"><i class="fas fa-arrow-right"></i><span>${escapeHtml(it.title)}</span></div>
                    <div class="search-item-meta">${escapeHtml(it.meta)}</div>
                </a>
            `).join('');

            // Intercept clicks for smooth scroll on same page
            resultsEl.querySelectorAll('a.search-item').forEach(a => {
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    const href = a.getAttribute('href');
                    if (!href) return;
                    setOverlayVisible(false);
                    setTimeout(() => navigate(href), 0);
                });
            });
        };

        const escapeHtml = (s) => (s || '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));

        // Open / close events
        openBtn.addEventListener('click', () => setOverlayVisible(true));
        closeBtn.addEventListener('click', () => setOverlayVisible(false));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) setOverlayVisible(false); });

        input.addEventListener('input', () => renderResults(input.value.trim()));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') setOverlayVisible(false);
        });

        // Keyboard shortcuts: Ctrl+K / Cmd+K, or "/" when not typing
        document.addEventListener('keydown', (e) => {
            const isMac = navigator.platform.toUpperCase().includes('MAC');
            const combo = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k';
            const slash = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey;

            if (combo) {
                e.preventDefault();
                setOverlayVisible(true);
                return;
            }
            if (slash) {
                const tag = (document.activeElement && document.activeElement.tagName || '').toLowerCase();
                if (tag !== 'input' && tag !== 'textarea') {
                    e.preventDefault();
                    setOverlayVisible(true);
                }
            }
            if (e.key === 'Escape' && overlay.classList.contains('visible')) {
                e.preventDefault();
                setOverlayVisible(false);
            }
        });

        // Sync placeholder + aria strings on language changes
        window.__updateSearchLanguage = () => {
            const isGr = currentLanguage === 'gr';
            input.placeholder = isGr ? 'Αναζήτηση στον ιστότοπο...' : 'Search the site...';
            input.setAttribute('aria-label', isGr ? 'Αναζήτηση στον ιστότοπο' : 'Search the site');
            closeBtn.setAttribute('aria-label', isGr ? 'Κλείσιμο αναζήτησης' : 'Close search');
            // Refresh results text if open
            if (overlay.classList.contains('visible')) renderResults(input.value.trim());
        };
        window.__updateSearchLanguage();

        // If page is opened with #search=term, open the search
        try {
            const h = decodeURIComponent((window.location.hash || '').replace(/^#/, ''));
            if (h.startsWith('search=')) {
                const term = h.slice(7);
                setOverlayVisible(true);
                input.value = term;
                renderResults(term);
            }
        } catch (_) {}
    }

    // Small UX + SEO fixes
    function initializeBrandingAndLinks() {
        // Add logo in navbar title (without changing HTML files)
        document.querySelectorAll('.nav-title h1').forEach(h1 => {
            if (h1.querySelector('img')) return;
            const img = document.createElement('img');
            img.alt = 'DedSec Project';
            img.width = 34;
            img.height = 34;
            img.loading = 'eager';
            img.decoding = 'async';
            img.style.borderRadius = '10px';
            img.style.border = '1px solid var(--nm-border)';
            img.style.background = 'rgba(255,255,255,0.04)';
            img.setAttribute('data-site-logo','1');
            img.src = getThemeLogo();
            h1.prepend(img);
        });

        // Ensure target=_blank links are safe
        document.querySelectorAll('a[target="_blank"]').forEach(a => {
            const rel = (a.getAttribute('rel') || '').toLowerCase();
            if (!rel.includes('noopener')) a.setAttribute('rel', (rel ? rel + ' ' : '') + 'noopener noreferrer');
        });

        // Fix broken local favicon paths by forcing a working icon
        const ensureIcon = () => {
            let link = document.querySelector('link[rel="icon"]');
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                link.type = 'image/jpeg';
                document.head.appendChild(link);
            }
            link.href = getThemeLogo();
        };
        ensureIcon();
        applyThemeAssets();
    }



    // --- DEEP-LINK ANCHORS (Deterministic IDs) ---
    function initializeDeepLinks() {
        const slugifyLocal = (str) => {
            return (str || '')
                .toString()
                .normalize('NFKD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 64) || 'section';
        };

        const scope = document.querySelector('main') || document.body;
        if (!scope) return;

        const candidates = scope.querySelectorAll('h1, h2, h3, h4, .feature-title, .tool-title, .category-header');
        const used = new Set();

        candidates.forEach((el) => {
            const raw = (el.getAttribute('data-en') || el.textContent || '').trim();
            if (!raw) return;
            if (el.id) { used.add(el.id); return; }

            const base = slugifyLocal(raw);
            let unique = base;
            let n = 2;
            while (used.has(unique) || document.getElementById(unique)) {
                unique = `${base}-${n++}`;
            }
            el.id = unique;
            used.add(unique);
        });
        const openAncestors = (el) => {
            if (!el) return;
            // Tool / FAQ accordions
            const toolItem = el.closest?.('.tool-item');
            if (toolItem) toolItem.classList.add('active');
            const category = el.closest?.('.category');
            if (category) category.classList.add('active');

            // Generic accordions / details
            const details = el.closest?.('details');
            if (details) details.open = true;
        };

        const scrollToHash = (behavior = 'smooth') => {
            if (!window.location.hash) return;
            const targetId = decodeURIComponent(window.location.hash.slice(1));
            const el = document.getElementById(targetId);
            if (!el) return;
            openAncestors(el);
            // Wait a frame so expanded content is measurable, then scroll
            requestAnimationFrame(() => {
                try {
                    el.scrollIntoView({ behavior, block: 'start' });
                } catch {
                    el.scrollIntoView();
                }
            });
        };

        // If we loaded a page with a hash, open + scroll after IDs exist
        scrollToHash('smooth');
        window.addEventListener('hashchange', () => scrollToHash('smooth'));
    }

// --- MAIN INIT ---
    function init() {
        initializeNavigation();
        initializeDeepLinks();
        initializeThemeSwitcher();
        initializeBrandingAndLinks();
        initializeSearch();
        initializeCarousels();
        initializeToolCategories('.categories-container');
        initializeToolCategories('#faq-container');
        
        // Language Switcher (Navbar)
        document.getElementById('nav-lang-switcher')?.addEventListener('click', () => {
            window.changeLanguage(currentLanguage === 'en' ? 'gr' : 'en');
        });

        // Modals
        document.querySelectorAll('.modal-overlay').forEach(m => {
            m.addEventListener('click', (e) => { if(e.target === m ) m.classList.remove('visible'); });
            m.querySelector('.close-modal')?.addEventListener('click', () => m.classList.remove('visible'));
        });

        // Final Setup
        window.changeLanguage(localStorage.getItem('language') || 'en');

        // Ensure the slide-out menu always sits under the real navbar height
        syncNavMenuOffset();
        window.addEventListener('resize', syncNavMenuOffset);

        // Defer large disclaimer DOM injection so first paint on mobile is faster
        const defer = (fn) => {
            if (typeof fn !== 'function') return;
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => fn(), { timeout: 1200 });
            } else {
                setTimeout(() => fn(), 250);
            }
        };
        // Active Link
        const page = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href').includes(page)));

        // Reveal Animations (skip on mobile + for reduced-motion users)
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isMobileLite = window.matchMedia('(max-width: 820px)').matches || window.matchMedia('(hover: none)').matches;

        if (!prefersReducedMotion && !isMobileLite) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        e.target.classList.add('animate-in');
                        observer.unobserve(e.target);
                    }
                });
            });
            document.querySelectorAll('.feature-card, .tool-item, .category').forEach(el => observer.observe(el));
        }
    }

    init();
});