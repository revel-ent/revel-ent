// ============================================
// REVEL ENTERTAINMENT — Main JS (Advanced)
// ============================================

// --- Header: transparent over hero, solid on scroll ---
const header = document.getElementById('site-header');
if (header) {
  const onScroll = () => {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// --- Mobile menu toggle ---
const mobileBtn  = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener('click', () => {
    const isOpen = mobileBtn.classList.toggle('open');
    mobileMenu.classList.toggle('open', isOpen);
    mobileBtn.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileBtn.classList.remove('open');
      mobileMenu.classList.remove('open');
      mobileBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

// --- Accordion (single-open) ---
document.querySelectorAll('.accordion-trigger').forEach(btn => {
  btn.addEventListener('click', () => {
    const isOpen  = btn.getAttribute('aria-expanded') === 'true';
    const panel   = btn.nextElementSibling;
    const wrapper = btn.closest('.accordion');

    // Close all in this accordion
    if (wrapper) {
      wrapper.querySelectorAll('.accordion-trigger').forEach(b => {
        b.setAttribute('aria-expanded', 'false');
        const p = b.nextElementSibling;
        if (p) p.classList.remove('open');
      });
    }

    // Open clicked if it was closed
    if (!isOpen && panel) {
      btn.setAttribute('aria-expanded', 'true');
      panel.classList.add('open');
    }
  });
});

// --- Subtle hero parallax ---
const heroBg = document.querySelector('.hero-bg');
if (heroBg) {
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    heroBg.style.transform = `translateY(${scrollY * 0.35}px)`;
  }, { passive: true });
}

// --- Intersection Observer for fade-in animations on scroll ---
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe sections for fade-in, except on Client Portal where immediate readability is preferred.
const isClientPortalPage = window.location.pathname.includes('client-portal.html');
if (!isClientPortalPage) {
  document.querySelectorAll('section, .accordion-item, .process-step, .portal-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
  });
}

// --- Smooth scroll to top on page load ---
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

// --- Shared analytics helper ---
const sendAnalyticsEvent = (eventName, payload) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, payload);
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...payload });
  }

  if (typeof window.plausible === 'function') {
    window.plausible(eventName, { props: payload });
  }
};

const portfolioTiles = document.querySelectorAll('.portfolio-grid .portfolio-tile');
if (portfolioTiles.length > 0) {
  portfolioTiles.forEach((tile, index) => {
    tile.addEventListener('click', () => {
      const image = tile.querySelector('img');
      const tileLabel = image ? image.getAttribute('alt') : `tile_${index + 1}`;
      const outboundUrl = tile.getAttribute('href') || '';

      sendAnalyticsEvent('portfolio_instagram_click', {
        event_category: 'engagement',
        event_label: tileLabel,
        link_url: outboundUrl,
        tile_position: index + 1,
        page_path: window.location.pathname
      });
    });
  });
}

// --- Outbound analytics for Client Portal CTAs ---
const portalLinks = document.querySelectorAll('[data-portal-event]');
if (portalLinks.length > 0) {
  portalLinks.forEach((link, index) => {
    link.addEventListener('click', () => {
      const eventName = link.getAttribute('data-portal-event') || `portal_click_${index + 1}`;
      const eventLabel = link.textContent ? link.textContent.trim() : eventName;
      const destination = link.getAttribute('href') || '';

      sendAnalyticsEvent(eventName, {
        event_category: 'engagement',
        event_label: eventLabel,
        destination,
        page_path: window.location.pathname
      });
    });
  });
}
