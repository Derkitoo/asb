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
  "Asphalte": { accent: "#C8FF3D", display: "Space Grotesk",       sharp: true  },
  "Ambre":    { accent: "#FF9E2C", display: "Archivo",             sharp: false },
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
          <TweakColor
            label="Accent"
            value={t.accent}
            options={["#FFD60A", "#C8FF3D", "#FF9E2C", "#FF5630"]}
            onChange={(v) => setTweak({ accent: v, direction: "—" })}
          />
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
          <TweakSection label="Contact" />
          <TweakText label="Téléphone" value={info.phone || ""} onChange={v => updateInfo('phone', v)} />
          <TweakText label="Email" value={info.email || ""} onChange={v => updateInfo('email', v)} />
          <TweakText label="Adresse" value={info.address || ""} onChange={v => updateInfo('address', v)} />
          <TweakText label="Adresse (court)" value={info.addressShort || ""} onChange={v => updateInfo('addressShort', v)} />
          
          <TweakSection label="Tarifs (€)" />
          <TweakText label="B Manuelle" value={info.priceBManual || ""} onChange={v => updateInfo('priceBManual', v)} />
          <TweakText label="B Automatique" value={info.priceBAuto || ""} onChange={v => updateInfo('priceBAuto', v)} />
          <TweakText label="Permis Moto A2" value={info.priceMoto || ""} onChange={v => updateInfo('priceMoto', v)} />
          <TweakText label="Conduite Acc." value={info.priceAAC || ""} onChange={v => updateInfo('priceAAC', v)} />
          <TweakText label="Passerelle Moto" value={info.pricePasserelle || ""} onChange={v => updateInfo('pricePasserelle', v)} />

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
