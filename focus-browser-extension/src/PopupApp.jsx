import { useEffect, useState } from 'react';
import { initLanguage, t } from './i18n/index.js';
import './styles/terminal.css';

export default function PopupApp() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initLanguage().then(() => setReady(true));
  }, []);

  if (!ready) return <div style={{ background: '#080808', height: '200px' }} />;

  function openTerminal() {
    chrome.tabs.create({ url: chrome.runtime.getURL('newtab.html') });
    window.close();
  }

  return (
    <div className="fb-popup">
      <div className="fb-popup-brand">Focus Browser</div>
      <div className="fb-popup-sub">Navigate with intention</div>
      <div className="fb-popup-divider" />
      <button className="fb-popup-btn" onClick={openTerminal}>
        → Open Terminal
      </button>
      <p className="fb-popup-hint">
        Or open a new tab (Ctrl+T / ⌘T)
      </p>
    </div>
  );
}
