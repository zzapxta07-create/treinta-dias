import { useState, useEffect } from 'react';
import Terminal    from './terminal/Terminal.jsx';
import IntentGate  from './intent/IntentGate.jsx';
import LoadingScreen from './intent/LoadingScreen.jsx';
import { t, initLanguage, getLanguage } from './i18n/index.js';
import { addHistoryEntry } from './storage/historyStorage.js';
import { recordOpen, recordCancelled } from './storage/statsStorage.js';
import { isDistractorUrl } from './terminal/commandRegistry.js';
import './styles/terminal.css';

// Allow use both as newtab and as popup (popup passes ?popup=1)
const params        = new URLSearchParams(window.location.search);
const IS_BLOCKED    = params.get('blocked') === '1';
const IS_LIMITED    = params.get('limited') === '1';
const LIMITED_DOMAIN = params.get('domain') || '';
const INCOMING_URL  = params.get('url') ? decodeURIComponent(params.get('url')) : null;

export default function App() {
  const [phase,       setPhase]       = useState('loading-lang'); // loading-lang | terminal | intent | loading
  const [pendingUrl,  setPendingUrl]  = useState(null);
  const [pendingMeta, setPendingMeta] = useState(null);

  useEffect(() => {
    initLanguage().then(() => {
      if (IS_BLOCKED) { setPhase('blocked'); return; }
      if (IS_LIMITED) { setPhase('limited'); return; }
      if (INCOMING_URL) {
        setPendingUrl(INCOMING_URL);
        setPendingMeta({ command: 'link', type: 'visit', isDistractor: isDistractorUrl(INCOMING_URL) });
        setPhase('intent');
        return;
      }
      setPhase('terminal');
    });
  }, []);

  // Called from Terminal when a URL should be opened
  function handleOpenUrl(url, meta) {
    if (meta?.noFriction) {
      window.location.href = url;
      return;
    }
    setPendingUrl(url);
    setPendingMeta(meta);
    setPhase('intent');
  }

  // Called from IntentGate when essay passes validation
  function handleIntentApproved(essay) {
    // Persist history entry immediately so cancel count is accurate
    // (will be overwritten with completed=true if flow completes)
    setPendingMeta(m => ({ ...m, essay }));
    setPhase('loading');
  }

  // Called from IntentGate cancel button
  async function handleIntentCancelled() {
    await recordCancelled();
    await addHistoryEntry({
      url: pendingUrl,
      command: pendingMeta?.command,
      type: pendingMeta?.type,
      essay: '',
      isDistractor: pendingMeta?.isDistractor || false,
      completed: false,
      lang: getLanguage(),
    });
    setPendingUrl(null);
    setPendingMeta(null);
    setPhase('terminal');
  }

  // Called from LoadingScreen when countdown finishes
  async function handleLoadingComplete() {
    const url  = pendingUrl;
    const meta = pendingMeta;
    if (!url) { setPhase('terminal'); return; }

    try {
      await recordOpen({
        url,
        type: meta?.type || 'visit',
        isDistractor: meta?.isDistractor || false,
      });
      await addHistoryEntry({
        url,
        command: meta?.command,
        type: meta?.type || 'visit',
        essay: meta?.essay || '',
        isDistractor: meta?.isDistractor || false,
        completed: true,
        lang: getLanguage(),
      });

      // Tell service worker to navigate (handles distractor bypass)
      chrome.runtime.sendMessage({
        type: 'NAVIGATE_URL',
        url,
        isDistractor: meta?.isDistractor || false,
      });
    } catch (e) {
      console.error('[FocusBrowser] navigate error:', e);
      // Fallback: direct navigate
      window.location.href = url;
    }

    setPendingUrl(null);
    setPendingMeta(null);
    setPhase('terminal');
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (phase === 'loading-lang') {
    return (
      <div style={{ background: '#080808', height: '100vh' }} />
    );
  }

  if (phase === 'blocked') {
    return <BlockedPage />;
  }

  if (phase === 'limited') {
    return <LimitedPage domain={LIMITED_DOMAIN} />;
  }

  if (phase === 'intent') {
    return (
      <IntentGate
        url={pendingUrl}
        onApproved={handleIntentApproved}
        onCancel={handleIntentCancelled}
      />
    );
  }

  if (phase === 'loading') {
    return (
      <LoadingScreen
        url={pendingUrl}
        onComplete={handleLoadingComplete}
      />
    );
  }

  return <Terminal onOpenUrl={handleOpenUrl} />;
}

function BlockedPage() {
  const T = t().blocked;

  function goToTerminal() {
    window.location.href = window.location.pathname; // remove ?blocked=1
  }

  return (
    <div className="fb-blocked">
      <h1 className="fb-blocked-heading">{T.heading}</h1>
      <p className="fb-blocked-message">{T.message}</p>
      <p className="fb-blocked-hint">{T.hint}</p>
      <button className="fb-btn fb-btn--ghost" onClick={goToTerminal}>
        {T.terminalBtn}
      </button>
    </div>
  );
}

function LimitedPage({ domain }) {
  const T = t().limited;

  function goToTerminal() {
    window.location.href = window.location.pathname; // remove ?limited=1&domain=...
  }

  return (
    <div className="fb-blocked">
      <h1 className="fb-blocked-heading">{T.heading}</h1>
      <p className="fb-blocked-message">{T.message(domain || '?')}</p>
      <p className="fb-blocked-hint">{T.hint}</p>
      <button className="fb-btn fb-btn--ghost" onClick={goToTerminal}>
        {T.terminalBtn}
      </button>
    </div>
  );
}
