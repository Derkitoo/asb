/* global React, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle, TweakText, TweakNumber */
const { useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "Signal",
  "accent": "#FFD60A",
  "display": "Bricolage Grotesque",
  "sharp": false
}/*EDITMODE-END*/;

const DIRECTIONS = {
  "Signal":   { accent: "#FFD60A", display: "Bricolage Grotesque", sharp: false },
  "Asphalte": { accent: "#FFD60A", display: "Space Grotesk",       sharp: true  },
  "Ambre":    { accent: "#FFD60A", display: "Archivo",             sharp: false },
};

function deepen(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, r * (1 - amt)); g = Math.max(0, g * (1 - amt)); b = Math.max(0, b * (1 - amt));
  return `#${[r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('')}`;
}
function softA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function readAndResizeImage(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_DIM = 1200;
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/webp', 0.85);
      callback(dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function TweakImage({ label, slotId, defaultSrc }) {
  const [imgUrl, setImgUrl] = React.useState('');
  const fileInputRef = React.useRef(null);

  React.useEffect(() => {
    const updatePreview = () => {
      if (window.imageSlots) {
        const slot = window.imageSlots.get(slotId);
        setImgUrl(slot ? slot.u : defaultSrc);
      }
    };
    updatePreview();
    window.addEventListener('tweakchange', updatePreview);
    window.addEventListener('imageslotchange', updatePreview);
    return () => {
      window.removeEventListener('tweakchange', updatePreview);
      window.removeEventListener('imageslotchange', updatePreview);
    };
  }, [slotId, defaultSrc]);

  const handleChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    readAndResizeImage(file, (dataUrl) => {
      if (window.imageSlots) {
        window.imageSlots.set(slotId, { u: dataUrl, s: 1, x: 0, y: 0 });
        setImgUrl(dataUrl);
        window.dispatchEvent(new CustomEvent('imageslotchange'));
      }
    });
    e.target.value = '';
  };

  const handleClear = () => {
    if (window.imageSlots) {
      window.imageSlots.clear(slotId);
      setImgUrl(defaultSrc);
      window.dispatchEvent(new CustomEvent('imageslotchange'));
    }
  };

  return (
    <div className="twk-row" style={{ marginBottom: '10px' }}>
      <div className="twk-lbl"><span>{label}</span></div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
        <img src={imgUrl} alt="" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', background: 'rgba(0,0,0,0.1)', border: '0.5px solid rgba(0,0,0,0.1)' }} />
        <button type="button" className="twk-btn secondary" style={{ height: '24px', fontSize: '10.5px', flex: 1, padding: 0 }} onClick={() => fileInputRef.current.click()}>
          Changer
        </button>
        <button type="button" className="twk-btn secondary" style={{ height: '24px', fontSize: '10.5px', padding: '0 8px' }} onClick={handleClear} title="Rétablir l'image par défaut">
          ✕
        </button>
        <input type="file" ref={fileInputRef} accept="image/png, image/jpeg, image/webp" style={{ display: 'none' }} onChange={handleChange} />
      </div>
    </div>
  );
}

function TweaksApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [activeTab, setActiveTab] = React.useState('design');
  const [info, setInfo] = React.useState(window.asbInfo ? window.asbInfo.get() : {});

  // Update info if it changes externally
  useEffect(() => {
    const onUpdate = () => {
      if (window.asbInfo) {
        setInfo({ ...window.asbInfo.get() });
      }
    };
    window.addEventListener('asbinfoupdate', onUpdate);
    // Initial fetch in case it finished before mount
    if (window.asbInfo) {
      setInfo({ ...window.asbInfo.get() });
    }
    return () => window.removeEventListener('asbinfoupdate', onUpdate);
  }, []);

  const updateInfo = (field, val) => {
    const newInfo = { ...info, [field]: val };
    setInfo(newInfo);
    if (window.asbInfo) {
      window.asbInfo.save(newInfo);
      window.dispatchEvent(new CustomEvent('asbinfoupdatesignal', { detail: newInfo }));
    }
  };

  // applying a named direction overrides the individual controls
  const applyDirection = (name) => {
    const d = DIRECTIONS[name];
    setTweak({ direction: name, accent: d.accent, display: d.display, sharp: d.sharp });
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', t.accent);
    root.style.setProperty('--accent-deep', deepen(t.accent, 0.16));
    root.style.setProperty('--accent-soft', softA(t.accent, 0.14));
    root.style.setProperty('--font-display', `'${t.display}', sans-serif`);
    document.body.classList.toggle('sharp', !!t.sharp);
  }, [t.accent, t.display, t.sharp]);

  return (
    <TweaksPanel title="Configuration ASB">
      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '0.5px solid rgba(0,0,0,0.1)' }}>
        <button type="button" 
                className={`twk-btn ${activeTab === 'design' ? '' : 'secondary'}`} 
                style={{ flex: 1, height: '24px', fontSize: '11px', padding: 0 }}
                onClick={() => setActiveTab('design')}>
          Design
        </button>
        <button type="button" 
                className={`twk-btn ${activeTab === 'infos' ? '' : 'secondary'}`} 
                style={{ flex: 1, height: '24px', fontSize: '11px', padding: 0 }}
                onClick={() => setActiveTab('infos')}>
          Infos École
        </button>
      </div>

      {activeTab === 'design' && (
        <>
          <TweakSection label="Direction" />
          <TweakRadio
            label="Style"
            value={t.direction}
            options={["Signal", "Asphalte", "Ambre"]}
            onChange={applyDirection}
          />
          <TweakSection label="Personnaliser" />
          <TweakRadio
            label="Police titres"
            value={t.display}
            options={["Bricolage Grotesque", "Space Grotesk", "Archivo"]}
            onChange={(v) => setTweak({ display: v, direction: "—" })}
          />
          <TweakToggle
            label="Angles nets"
            value={t.sharp}
            onChange={(v) => setTweak({ sharp: v })}
          />
        </>
      )}

      {activeTab === 'infos' && (
        <>
          <TweakSection label="Images du site" />
          <TweakImage label="Photo Façade" slotId="hero-facade" defaultSrc="facade.jpg" />
          <TweakImage label="Photo Leçon" slotId="why-photo" defaultSrc="lesson.jpg" />
          <TweakImage label="Photo Permis Moto" slotId="moto-photo" defaultSrc="moto.jpg" />
          
          <TweakSection label="Contact" />
          <TweakText label="Téléphone" value={info.phone || ""} onChange={v => updateInfo('phone', v)} />
          <TweakText label="Email" value={info.email || ""} onChange={v => updateInfo('email', v)} />
          <TweakText label="Adresse" value={info.address || ""} onChange={v => updateInfo('address', v)} />
          <TweakText label="Adresse (court)" value={info.addressShort || ""} onChange={v => updateInfo('addressShort', v)} />
          
          <TweakSection label="Tarifs (€)" />
          <TweakText label="B Automatique (13h)" value={info.priceBAuto || ""} onChange={v => updateInfo('priceBAuto', v)} />
          <TweakText label="B Manuelle (20h)" value={info.priceBManual || ""} onChange={v => updateInfo('priceBManual', v)} />
          <TweakText label="B Manuelle (30h)" value={info.priceBManual30 || ""} onChange={v => updateInfo('priceBManual30', v)} />
          <TweakText label="Conduite Acc. (AAC)" value={info.priceAAC || ""} onChange={v => updateInfo('priceAAC', v)} />
          <TweakText label="Formation Accélérée" value={info.priceAcceleree || ""} onChange={v => updateInfo('priceAcceleree', v)} />
          <TweakText label="Passerelle BEA → B" value={info.pricePasserelleBEA || ""} onChange={v => updateInfo('pricePasserelleBEA', v)} />
          <TweakText label="Moto A1/A2 (20h)" value={info.priceMoto || ""} onChange={v => updateInfo('priceMoto', v)} />
          <TweakText label="Moto A1/A2 (30h)" value={info.priceMoto30 || ""} onChange={v => updateInfo('priceMoto30', v)} />
          <TweakText label="Passerelles Moto / AM" value={info.pricePasserelle || ""} onChange={v => updateInfo('pricePasserelle', v)} />
          <TweakText label="Formation Post-Permis" value={info.pricePostPermis || ""} onChange={v => updateInfo('pricePostPermis', v)} />

          <TweakSection label="Horaires" />
          <TweakText label="Lun – Ven" value={info.hoursWeek || ""} onChange={v => updateInfo('hoursWeek', v)} />
          <TweakText label="Samedi" value={info.hoursSat || ""} onChange={v => updateInfo('hoursSat', v)} />
          <TweakText label="Dimanche" value={info.hoursSun || ""} onChange={v => updateInfo('hoursSun', v)} />

          <TweakSection label="Indicateurs" />
          <TweakText label="Réussite B (%)" value={info.successRate || ""} onChange={v => updateInfo('successRate', v)} />
          <TweakText label="Expérience (ans)" value={info.experienceYears || ""} onChange={v => updateInfo('experienceYears', v)} />
          <TweakText label="Élèves formés" value={info.studentsCount || ""} onChange={v => updateInfo('studentsCount', v)} />
          <TweakText label="Note /5" value={info.rating || ""} onChange={v => updateInfo('rating', v)} />
        </>
      )}
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<TweaksApp />);
