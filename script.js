
/* DedSec Project — Rebuilt JS (fast, minimal) */
(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // ---- Language ----
  let currentLanguage = localStorage.getItem("language") || "en";

  function setLang(lang){
    currentLanguage = (lang === "gr") ? "gr" : "en";
    document.documentElement.lang = currentLanguage;
    localStorage.setItem("language", currentLanguage);

    $$("[data-en]").forEach(el => {
      const text = el.getAttribute(`data-${currentLanguage}`) || el.getAttribute("data-en");
      // placeholders
      if (el.tagName === "INPUT" && el.hasAttribute(`data-${currentLanguage}-placeholder`)) {
        el.setAttribute("placeholder", el.getAttribute(`data-${currentLanguage}-placeholder`));
        return;
      }
      // If element has child elements, update only text nodes
      if (el.children.length === 0) {
        el.textContent = text;
      } else {
        for (const node of Array.from(el.childNodes)) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length) {
            node.textContent = text;
          }
        }
      }
    });
  }

  // ---- Theme ----
  function setTheme(theme){
    const isLight = theme === "light";
    document.body.classList.toggle("theme-light", isLight);
    document.body.classList.toggle("theme-dark", !isLight);
    localStorage.setItem("theme", isLight ? "light" : "dark");

    const icon = $("#theme-toggle i");
    if (icon) icon.className = isLight ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }

  // ---- Nav ----
  function initNav(){
    const toggle = $("#nav-toggle");
    const panel = $("#nav-panel");
    if (!toggle || !panel) return;

    toggle.addEventListener("click", () => {
      const open = panel.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    $$(".nav-link").forEach(a => {
      a.addEventListener("click", () => {
        panel.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", (e) => {
      if (!panel.classList.contains("open")) return;
      if (panel.contains(e.target) || toggle.contains(e.target)) return;
      panel.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  }

  // ---- Accordions (compat with old markup) ----
  function initAccordions(){
    $$(".category-header").forEach(h => {
      h.addEventListener("click", () => h.parentElement.classList.toggle("active"));
    });
    $$(".tool-header").forEach(h => {
      h.addEventListener("click", (e) => { e.stopPropagation(); h.parentElement.classList.toggle("active"); });
    });

    // FAQ patterns
    $$(".faq-question").forEach(q => {
      q.addEventListener("click", () => q.closest(".faq-item")?.classList.toggle("active"));
    });
  }

  // ---- Search (client-side, in-page) ----
  function initSearch(){
    const input = $("#site-search");
    const results = $("#search-results");
    const clearBtn = $("#search-clear");
    if (!input || !results || !clearBtn) return;

    const main = $("#main") || document.body;

    // Build a small index of "interesting" nodes
    const candidates = [
      ...$$("h1,h2,h3,h4,h5,a,button,li,p,.tool-title", main)
    ].filter(el => {
      const txt = (el.textContent || "").trim();
      return txt.length >= 3 && !el.closest(".search-results");
    });

    function escapeHtml(s){
      return s.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
    }

    function highlight(text, q){
      const safe = escapeHtml(text);
      const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
      return safe.replace(re, "<mark>$1</mark>");
    }

    function closeResults(){
      results.style.display = "none";
      results.innerHTML = "";
      clearBtn.style.display = input.value ? "block" : "none";
    }

    function openResults(){
      results.style.display = "block";
      clearBtn.style.display = input.value ? "block" : "none";
    }

    function scrollToEl(el){
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("search-hit");
      setTimeout(() => el.classList.remove("search-hit"), 900);
    }

    let lastQuery = "";
    input.addEventListener("input", () => {
      const q = input.value.trim();
      clearBtn.style.display = q ? "block" : "none";
      if (q.length < 2) return closeResults();
      if (q === lastQuery) return;

      lastQuery = q;
      const qLower = q.toLowerCase();

      const matches = [];
      for (const el of candidates){
        const t = (el.textContent || "").trim();
        if (t.toLowerCase().includes(qLower)) {
          matches.push({ el, text: t });
          if (matches.length >= 12) break;
        }
      }

      if (!matches.length){
        results.innerHTML = `<div class="result" style="cursor:default"><strong>${currentLanguage === "gr" ? "Δεν βρέθηκε κάτι" : "No results"}</strong><small>${currentLanguage === "gr" ? "Δοκίμασε άλλο όρο αναζήτησης." : "Try a different keyword."}</small></div>`;
        openResults();
        return;
      }

      results.innerHTML = matches.map(({el, text}, idx) => {
        const snippet = text.length > 90 ? (text.slice(0, 90) + "…") : text;
        const tag = el.tagName.toLowerCase();
        return `<a href="#" class="result" data-idx="${idx}">
          <strong>${highlight(snippet, q)}</strong>
          <small>${tag}${el.classList.length ? "." + Array.from(el.classList).slice(0,2).join(".") : ""}</small>
        </a>`;
      }).join("");

      $$(".result", results).forEach(a => {
        a.addEventListener("click", (e) => {
          e.preventDefault();
          const idx = Number(a.getAttribute("data-idx"));
          const target = matches[idx]?.el;
          if (target) scrollToEl(target);
          closeResults();
        });
      });

      openResults();
    });

    clearBtn.addEventListener("click", () => {
      input.value = "";
      input.focus();
      lastQuery = "";
      closeResults();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== input) {
        e.preventDefault();
        input.focus();
      }
      if (e.key === "Escape") closeResults();
    });

    document.addEventListener("click", (e) => {
      if (!results.style.display || results.style.display === "none") return;
      if (results.contains(e.target) || input.contains(e.target)) return;
      closeResults();
    });

    closeResults();
  }


  // ---- Legacy helpers (kept for existing markup) ----
  window.changeLanguage = (lang) => setLang(lang);

  window.copyToClipboard = (button, targetId) => {
    const el = document.getElementById(targetId);
    const text = el ? (el.innerText || el.textContent || "") : "";
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      const original = button.textContent;
      button.textContent = (currentLanguage === "gr") ? "Αντιγράφηκε!" : "Copied!";
      button.classList.add("copy-success");
      setTimeout(() => {
        button.textContent = original;
        button.classList.remove("copy-success");
      }, 1200);
    });
  };

  function initCarousels(){
    $$(".collaborations-carousel").forEach(c => {
      const imgs = $$(".slide-image", c);
      if (!imgs.length) return;
      let idx = 0;
      const show = () => imgs.forEach((img, i) => img.classList.toggle("active", i === idx));
      c.querySelector(".prev-btn")?.addEventListener("click", () => { idx = (idx > 0) ? idx - 1 : imgs.length - 1; show(); });
      c.querySelector(".next-btn")?.addEventListener("click", () => { idx = (idx < imgs.length - 1) ? idx + 1 : 0; show(); });
      show();
    });
  }

  function initFooterYear(){
    const y = $("#year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function init(){
    initNav();
    initAccordions();
    initCarousels();
    initSearch();
    initFooterYear();

    // buttons
    $("#lang-toggle")?.addEventListener("click", () => setLang(currentLanguage === "en" ? "gr" : "en"));
    $("#theme-toggle")?.addEventListener("click", () => {
      const next = document.body.classList.contains("theme-light") ? "dark" : "light";
      setTheme(next);
    });

    // load saved theme
    const saved = localStorage.getItem("theme");
    setTheme(saved === "light" ? "light" : "dark");

    // load language
    setLang(currentLanguage);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
