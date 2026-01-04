document.addEventListener('DOMContentLoaded', () => {
  let currentLanguage = localStorage.getItem('language') || 'en';

  // ---------- NAV ----------
  const burgerMenu = document.getElementById('burger-menu');
  const mobileMenu = document.getElementById('mobile-menu');

  if (burgerMenu && mobileMenu) {
    burgerMenu.addEventListener('click', () => {
      burgerMenu.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!mobileMenu.classList.contains('active')) return;
      const topbar = document.querySelector('.topbar');
      if (topbar && !topbar.contains(e.target)) {
        burgerMenu.classList.remove('active');
        mobileMenu.classList.remove('active');
      }
    });

    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        burgerMenu.classList.remove('active');
        mobileMenu.classList.remove('active');
      });
    });
  }

  // ---------- THEME ----------
  const themeBtn = document.getElementById('nav-theme-switcher');
  const applyThemeLabel = () => {
    const isLight = document.body.classList.contains('light-theme');
    const span = themeBtn?.querySelector('span');
    const icon = themeBtn?.querySelector('i');
    if (!span || !icon) return;
    icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
    span.setAttribute('data-en', isLight ? 'Light Theme' : 'Dark Theme');
    span.setAttribute('data-gr', isLight ? 'Φωτεινό Θέμα' : 'Σκοτεινό Θέμα');
    span.textContent = span.getAttribute(`data-${currentLanguage}`) || span.getAttribute('data-en');
  };

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') document.body.classList.add('light-theme');
  applyThemeLabel();

  themeBtn?.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
    applyThemeLabel();
  });

  // ---------- LANGUAGE ----------
  const setLangButtons = () => {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === currentLanguage);
    });
  };

  window.changeLanguage = (lang) => {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    localStorage.setItem('language', lang);

    document.querySelectorAll('[data-en]').forEach(el => {
      const fallback = el.getAttribute('data-en') || '';
      const next = el.getAttribute(`data-${lang}`) || fallback;
      el.textContent = next;
    });

    // Any dynamic links by language
    document.querySelectorAll('[data-en-link]').forEach(link => {
      const newHref = link.getAttribute(`data-${lang}-link`);
      if (newHref) link.setAttribute('href', newHref);
    });

    applyThemeLabel();
    setLangButtons();
  };

  setLangButtons();
  window.changeLanguage(currentLanguage);

  // ---------- ACTIVE NAV LINK ----------
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href.endsWith(path)) a.classList.add('active');
  });

  // ---------- COPY BUTTONS ----------
  const toast = document.getElementById('toast');
  let toastTimer = null;

  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };

  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy') || '';
      try {
        await navigator.clipboard.writeText(text);
        showToast(currentLanguage === 'gr' ? 'Αντιγράφηκε!' : 'Copied!');
      } catch (e) {
        showToast(currentLanguage === 'gr' ? 'Αποτυχία αντιγραφής' : 'Copy failed');
      }
    });
  });

  // ---------- OPTIONAL: Smooth scroll for in-page anchors ----------
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });


  // ---------- TOOL LIBRARY TOGGLES (for learn-about-the-tools.html) ----------
  const categoryHeaders = document.querySelectorAll('.category-header');
  categoryHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const category = header.closest('.category');
      const list = category?.querySelector('.tools-list');
      const icon = header.querySelector('.toggle-icon i') || header.querySelector('i');
      if (!list) return;
      const isOpen = list.classList.contains('active');
      document.querySelectorAll('.tools-list.active').forEach(l => l.classList.remove('active'));
      if (!isOpen) list.classList.add('active');
      // rotate icon
      if (icon) icon.style.transform = list.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
    });
  });

  const toolHeaders = document.querySelectorAll('.tool-header');
  toolHeaders.forEach(th => {
    th.addEventListener('click', () => {
      const item = th.closest('.tool-item');
      const desc = item?.querySelector('.tool-description');
      const icon = th.querySelector('.tool-expand-icon i') || th.querySelector('i');
      if (!desc) return;
      const isHidden = desc.classList.contains('hidden-by-default');
      // close others in same category for cleanliness
      item?.parentElement?.querySelectorAll('.tool-description').forEach(d => {
        if (d !== desc) d.classList.add('hidden-by-default');
      });
      desc.classList.toggle('hidden-by-default', !isHidden);
      if (icon) icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    });
  });

});
