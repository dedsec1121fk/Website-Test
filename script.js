/* =========================================================
   DedSec Project — Site JS (fast, lightweight)
   - Theme toggle (light/dark) + logo swap
   - Mobile menu toggle
   - Site search modal (local index)
   ========================================================= */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);

  const html = document.documentElement;
  const themeToggle = $("#themeToggle");
  const menuToggle = $("#menuToggle");
  const mobileNav = $("#mobileNav");
  const logo = $("#siteLogo");

  const searchModal = $("#searchModal");
  const openSearchBtn = $("#openSearchBtn");
  const closeSearchBtn = $("#closeSearchBtn");
  const searchInput = $("#siteSearchInput");
  const searchResults = $("#searchResults");

  const INDEX = Array.isArray(window.__DEDSEC_SEARCH_INDEX__) ? window.__DEDSEC_SEARCH_INDEX__ : [];

  function getStoredTheme() {
    try { return localStorage.getItem("dedsec_theme"); } catch (_) { return null; }
  }

  function storeTheme(value) {
    try { localStorage.setItem("dedsec_theme", value); } catch (_) {}
  }

  function applyTheme(theme) {
    const t = theme === "light" ? "light" : "dark";
    html.setAttribute("data-theme", t);

    // Swap logo based on theme (keep URLs unchanged)
    if (logo) {
      const light = logo.getAttribute("data-logo-light");
      const dark = logo.getAttribute("data-logo-dark");
      logo.src = (t === "light") ? (light || logo.src) : (dark || logo.src);
    }
  }

  function initTheme() {
    const stored = getStoredTheme();
    if (stored) {
      applyTheme(stored);
      return;
    }
    // Prefer OS if no stored preference
    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    applyTheme(prefersLight ? "light" : "dark");
  }

  function toggleTheme() {
    const current = html.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    storeTheme(next);
  }

  function toggleMobileNav(forceOpen) {
    if (!mobileNav || !menuToggle) return;
    const isOpen = mobileNav.classList.contains("is-open");
    const nextOpen = typeof forceOpen === "boolean" ? forceOpen : !isOpen;
    mobileNav.classList.toggle("is-open", nextOpen);
    menuToggle.setAttribute("aria-expanded", String(nextOpen));
  }

  function closeMobileNavOnNavigate() {
    if (!mobileNav) return;
    mobileNav.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      toggleMobileNav(false);
    });
  }

  // ---------------- Search ----------------
  function openSearch() {
    if (!searchModal) return;
    searchModal.classList.add("is-open");
    searchModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (searchInput) {
      searchInput.value = "";
      searchInput.focus({ preventScroll: true });
      renderResults("");
    }
  }

  function closeSearch() {
    if (!searchModal) return;
    searchModal.classList.remove("is-open");
    searchModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function normalize(s) {
    return (s || "").toString().toLowerCase().trim();
  }

  function scoreEntry(q, entry) {
    const title = normalize(entry.title);
    const url = normalize(entry.url);
    const kws = Array.isArray(entry.keywords) ? entry.keywords.map(normalize) : [];
    if (!q) return 0;

    let score = 0;
    if (title.includes(q)) score += 10;
    if (url.includes(q)) score += 3;

    for (const k of kws) {
      if (k === q) score += 10;
      else if (k.includes(q)) score += 6;
    }

    // small bonus for prefix matches
    if (title.startsWith(q)) score += 3;
    return score;
  }

  function renderResults(query) {
    if (!searchResults) return;
    const q = normalize(query);
    const results = (INDEX || [])
      .map((e) => ({ e, s: scoreEntry(q, e) }))
      .filter((x) => (q ? x.s > 0 : true))
      .sort((a, b) => b.s - a.s)
      .slice(0, 10)
      .map((x) => x.e);

    if (!q) {
      searchResults.innerHTML = [
        resultCard({ title: "Start Here", url: "/Pages/guide-for-installation.html#top" }),
        resultCard({ title: "Tools Overview", url: "/Pages/learn-about-the-tools.html#top" }),
        resultCard({ title: "FAQ", url: "/Pages/faq.html#top" })
      ].join("");
      return;
    }

    if (results.length === 0) {
      searchResults.innerHTML = `<div class="result"><p class="result-title">No results</p><p class="result-url">Try a different keyword.</p></div>`;
      return;
    }

    searchResults.innerHTML = results.map(resultCard).join("");
  }

  function resultCard(entry) {
    const safeTitle = escapeHtml(entry.title || "Result");
    const safeUrl = escapeHtml(entry.url || "/index.html");
    return `
      <a class="result" role="option" href="${safeUrl}">
        <p class="result-title">${safeTitle}</p>
        <p class="result-url">${safeUrl}</p>
      </a>
    `;
  }

  function escapeHtml(str) {
    return (str || "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m]));
  }

  function bindSearch() {
    if (openSearchBtn) openSearchBtn.addEventListener("click", openSearch);
    if (closeSearchBtn) closeSearchBtn.addEventListener("click", closeSearch);

    if (searchModal) {
      searchModal.addEventListener("click", (e) => {
        const close = e.target && e.target.getAttribute && e.target.getAttribute("data-close-search");
        if (close) closeSearch();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSearch();
      // Ctrl/Cmd + K opens search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
      }
    });

    if (searchInput) {
      searchInput.addEventListener("input", () => renderResults(searchInput.value));
    }

    // If URL has ?query=... open search and show
    const params = new URLSearchParams(window.location.search);
    const q = params.get("query");
    if (q) {
      openSearch();
      if (searchInput) {
        searchInput.value = q;
        renderResults(q);
      }
    }
  }

  // Smooth anchor scroll (native where supported)
  function initAnchorScroll() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;

      const href = a.getAttribute("href") || "";
      // Close search if user clicks a result
      if (searchModal && searchModal.classList.contains("is-open") && a.classList.contains("result")) {
        closeSearch();
      }

      // Same-page anchor smooth scroll
      if (href.startsWith("#")) {
        const el = document.getElementById(href.slice(1));
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          history.pushState(null, "", href);
          toggleMobileNav(false);
        }
      }
    });
  }

  // Init
  initTheme();
  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
  if (menuToggle) menuToggle.addEventListener("click", () => toggleMobileNav());
  closeMobileNavOnNavigate();
  bindSearch();
  initAnchorScroll();
})();