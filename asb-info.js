(function() {
  const STATE_FILE = 'asb-info.state.json';
  const CACHE_KEY = 'asb-info-state';
  
  const defaults = {
    phone: "01 43 60 00 00",
    email: "inscription@asb-compagnie.fr",
    address: "12 rue de Paris, 93260 Les Lilas",
    addressShort: "12 rue de Paris, Les Lilas",
    successRate: "83",
    experienceYears: "8",
    studentsCount: "3000",
    rating: "4.9",
    priceBManual: "1 190",
    priceBAuto: "990",
    priceMoto: "790",
    priceAAC: "1 290",
    pricePasserelle: "290",
    hoursWeek: "10h – 13h · 14h – 19h",
    hoursSat: "10h – 17h",
    hoursSun: "Fermé"
  };

  let currentInfo = Object.assign({}, defaults);

  // Synchronously load from localStorage if cached to avoid content flash
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      Object.assign(currentInfo, JSON.parse(cached));
    }
  } catch (e) {
    console.warn('Could not read cached info', e);
  }

  function applyInfo(info) {
    Object.assign(currentInfo, info);
    
    // Save to cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(currentInfo));
    } catch (e) {}

    // Find and update DOM elements
    document.querySelectorAll('[data-asb-field]').forEach(el => {
      const field = el.getAttribute('data-asb-field');
      if (currentInfo[field] === undefined) return;
      
      const value = currentInfo[field];
      const type = el.getAttribute('data-asb-type') || 'text';
      
      if (type === 'tel') {
        el.href = 'tel:' + value.replace(/\s+/g, '');
        el.textContent = value;
      } else if (type === 'email') {
        el.href = 'mailto:' + value;
        el.textContent = value;
        el.removeAttribute('data-cfemail');
      } else if (type === 'href') {
        el.href = value;
      } else if (type === 'count') {
        el.setAttribute('data-count', value);
        const numSpan = el.querySelector('.cnum');
        if (numSpan) {
          numSpan.textContent = value;
        } else {
          el.textContent = value;
        }
      } else {
        el.textContent = value;
      }
    });
  }

  window.asbInfo = {
    defaults: defaults,
    get: () => currentInfo,
    apply: applyInfo,
    save: (newInfo) => {
      const merged = Object.assign({}, currentInfo, newInfo);
      applyInfo(merged);
      if (window.omelette && window.omelette.writeFile) {
        window.omelette.writeFile(STATE_FILE, JSON.stringify(merged));
      } else if (window.parent && window.parent.postMessage) {
        // Fallback for iframe hosting
        window.parent.postMessage({ type: '__asb_info_save', data: merged }, '*');
      }
    }
  };

  // Run DOM updates immediately (with defaults or cached values)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyInfo(currentInfo));
  } else {
    applyInfo(currentInfo);
  }

  // Fetch updated state file in background
  fetch(STATE_FILE)
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (data) {
        applyInfo(data);
        window.dispatchEvent(new CustomEvent('asbinfoupdate'));
      }
    })
    .catch(() => {});

  // Listen to cross-script updates (e.g. from tweaks-app editor)
  window.addEventListener('asbinfoupdatesignal', (e) => {
    if (e.detail) {
      applyInfo(e.detail);
    }
  });
})();
