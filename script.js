(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const storage = {
    get(key, fallback=null){
      try{ const v = localStorage.getItem(key); return v ?? fallback; }catch{ return fallback; }
    },
    set(key, val){
      try{ localStorage.setItem(key, String(val)); }catch{}
    }
  };

  function slugify(str){
    return (str || "")
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9\u0370-\u03ff]+/g, "-") // allow greek
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function ensureHeadingIds(){
    const headings = $$("main h1, main h2, main h3, article h1, article h2, article h3, .content-section h1, .content-section h2, .content-section h3, h1, h2, h3")
      .filter(h => h && h.textContent && h.textContent.trim().length > 0);

    const seen = new Set($$("[id]").map(el => el.id));
    headings.forEach(h => {
      if (h.id) return;
      const base = slugify(h.textContent);
      if (!base) return;
      let id = base;
      let i = 2;
      while (seen.has(id)) { id = `${base}-${i++}`; }
      h.id = id;
      seen.add(id);
    });
  }

  function setTheme(theme){
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    storage.set("theme", theme);

    // logo swap
    const logo = $(".brand-logo");
    if (logo){
      const dark = logo.getAttribute("data-logo-dark");
      const light = logo.getAttribute("data-logo-light");
      logo.src = (theme === "light" ? (light || logo.src) : (dark || logo.src));
    }

    const icon = $("#nav-theme-switcher .icon");
    if (icon) icon.textContent = theme === "light" ? "☀" : "☾";
  }

  function initTheme(){
    const saved = storage.get("theme");
    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    setTheme(saved || (prefersLight ? "light" : "dark"));
    const btn = $("#nav-theme-switcher");
    if (btn){
      btn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        setTheme(current === "dark" ? "light" : "dark");
      });
    }
  }

  function setLang(lang){
    storage.set("lang", lang);
    $$("[data-en][data-gr]").forEach(el => {
      el.textContent = (lang === "gr") ? el.getAttribute("data-gr") : el.getAttribute("data-en");
    });

    // update placeholders for search
    const input = $("#site-search");
    if (input){
      input.placeholder = (lang === "gr") ? "Αναζήτηση…" : "Search…";
      input.setAttribute("aria-label", (lang === "gr") ? "Αναζήτηση στον ιστότοπο" : "Search the site");
    }
  }

  function initLang(){
    const saved = storage.get("lang", "en");
    setLang(saved);
    const btn = $("#nav-lang-switcher");
    if (btn){
      btn.addEventListener("click", () => {
        const current = storage.get("lang", "en");
        setLang(current === "en" ? "gr" : "en");
      });
    }
  }

  function initBurger(){
    const burger = $("#burger-menu");
    const menu = $("#nav-menu");
    if (!burger || !menu) return;
    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // close on nav click (mobile)
    menu.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      if (window.matchMedia("(max-width: 760px)").matches){
        menu.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  function ensureMobileSearch(){
    const nav = $(".main-nav");
    const navSearch = $(".nav-search");
    if (!nav || !navSearch) return;

    let mobile = $(".mobile-search");
    if (!mobile){
      mobile = document.createElement("div");
      mobile.className = "mobile-search";
      mobile.innerHTML = navSearch.innerHTML;
      nav.insertAdjacentElement("afterend", mobile);
    }
  }

  function buildSearchIndex(){
    const items = [];

    // nav links
    $$("#nav-menu a.nav-link").forEach(a => {
      const text = (a.textContent || "").trim();
      const href = a.getAttribute("href") || "#";
      items.push({ label: text, hint: "Page", href });
    });

    // on-page headings (prefer h2/h3)
    const headingEls = $$("h2, h3").filter(h => h.id && h.textContent);
    headingEls.forEach(h => {
      const label = h.textContent.trim();
      if (!label) return;
      items.push({ label, hint: "Section", href: `#${h.id}` });
    });

    // de-dup by href+label
    const seen = new Set();
    return items.filter(it => {
      const k = `${it.href}::${it.label}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function highlightTarget(id){
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("jump-highlight");
    window.setTimeout(() => el.classList.remove("jump-highlight"), 1300);
  }

  function initSearch(){
    const input = $("#site-search");
    const results = $("#search-results");
    if (!input || !results) return;

    const index = buildSearchIndex();

    function render(matches){
      results.innerHTML = "";
      if (!matches.length){
        results.hidden = true;
        return;
      }
      const frag = document.createDocumentFragment();
      matches.slice(0, 8).forEach(m => {
        const a = document.createElement("a");
        a.className = "search-item";
        a.href = m.href;
        a.innerHTML = `<span>${escapeHtml(m.label)}</span><small>${escapeHtml(m.hint)}</small>`;
        a.addEventListener("click", (e) => {
          // anchor navigation: smooth scroll + highlight
          if (m.href.startsWith("#")){
            e.preventDefault();
            const id = m.href.slice(1);
            const el = document.getElementById(id);
            if (el){
              el.scrollIntoView({ behavior: "smooth", block: "start" });
              highlightTarget(id);
              close();
            }
          } else {
            close();
          }
        });
        frag.appendChild(a);
      });
      results.appendChild(frag);
      results.hidden = false;
    }

    function close(){
      results.hidden = true;
    }

    function onInput(){
      const q = (input.value || "").trim().toLowerCase();
      if (!q){ close(); return; }
      const matches = index.filter(it => it.label.toLowerCase().includes(q));
      render(matches);
    }

    input.addEventListener("input", onInput);
    input.addEventListener("focus", onInput);

    document.addEventListener("click", (e) => {
      if (e.target === input) return;
      if (results.contains(e.target)) return;
      close();
    });

    // keyboard
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    // handle initial hash highlight
    window.addEventListener("hashchange", () => {
      const id = (location.hash || "").slice(1);
      if (id) highlightTarget(id);
    });
    if (location.hash) highlightTarget(location.hash.slice(1));
  }

  function escapeHtml(str){
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function initDisclaimer(){
    const modal = $("#disclaimer-modal");
    if (!modal) return;

    const accepted = storage.get("disclaimerAccepted", "0") === "1";
    if (accepted){
      modal.style.display = "none";
      return;
    }

    // optional language button inside modal
    const langBtn = $("#disclaimer-lang-btn");
    if (langBtn){
      langBtn.addEventListener("click", () => {
        const current = storage.get("lang", "en");
        const next = current === "en" ? "gr" : "en";
        setLang(next);
      });
    }

    const decline = $("#decline-disclaimer");
    const accept = $("#accept-disclaimer");
    if (decline){
      decline.addEventListener("click", () => {
        // keep them on the site but hide modal; if they really want to leave they can.
        modal.style.display = "none";
      });
    }
    if (accept){
      accept.addEventListener("click", () => {
        storage.set("disclaimerAccepted", "1");
        modal.style.display = "none";
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureHeadingIds();
    initTheme();
    initLang();
    initBurger();
    ensureMobileSearch();
    initSearch();
    initDisclaimer();
  });
})();
