(function() {
  const STATE_FILE = 'asb-info.state.json';
  const CACHE_KEY = 'asb-info-state';
  
  const defaults = {
    phone: "09 55 46 90 61",
    phoneSecondary: "07 82 82 29 03",
    email: "abs.compagnie@gmail.com",
    address: "53 Bd du Général Leclerc de Hauteclocque - 93260 Les Lilas",
    addressShort: "53 Bd du Général Leclerc, Les Lilas",
    successRate: "83",
    experienceYears: "8",
    studentsCount: "3000",
    rating: "4.9",
    priceBAuto: "790",
    priceBManual: "950",
    priceBManual30: "1 440",
    priceAAC: "1 190",
    priceMoto: "790",
    priceMoto30: "1 190",
    pricePasserelle: "290",
    pricePasserelleBEA: "450",
    pricePostPermis: "150",
    priceAcceleree: "1 690",
    hoursWeek: "10h00 - 12h00 · 14h00 - 19h00",
    hoursSat: "10h00 - 14h00",
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
