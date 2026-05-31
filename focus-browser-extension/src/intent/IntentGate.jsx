import { useState, useRef, useEffect } from 'react';
import { t } from '../i18n/index.js';
import { validateEssay, countWords } from './intentValidator.js';

const MIN_WORDS = 50;

export default function IntentGate({ url, onApproved, onCancel }) {
  const [text,    setText]    = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);

  const T = t();
  const wc = countWords(text);
  const wcOk = wc >= MIN_WORDS;

  useEffect(() => { textareaRef.current?.focus(); }, []);

  function handlePaste(e)        { e.preventDefault(); }
  function handleContextMenu(e)  { e.preventDefault(); }
  function handleDrop(e)         { e.preventDefault(); }

  function handleChange(e) {
    setText(e.target.value);
    if (error) setError('');
  }

  function handleSubmit() {
    const result = validateEssay(text, MIN_WORDS);
    if (!result.valid) {
      const err = T.intent.errors[result.error];
      setError(typeof err === 'function' ? err(result.actual, MIN_WORDS) : err);
      return;
    }
    setLoading(true);
    onApproved(text.trim());
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  }

  const headerLines = [
    T.intent.title,
    T.intent.opening(url),
    '',
    T.intent.instructions,
    '',
    ...T.intent.questions,
    '',
    T.intent.footer,
  ];

  return (
    <div className="fb-intent">
      <div className="fb-intent-header">
        {headerLines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      {error && (
        <div className="fb-intent-error">{error}</div>
      )}

      <textarea
        ref={textareaRef}
        className="fb-intent-textarea"
        value={text}
        onChange={handleChange}
        onPaste={handlePaste}
        onContextMenu={handleContextMenu}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        placeholder={T.intent.placeholder}
        spellCheck={false}
        autoCorrect="off"
        autoComplete="off"
      />

      <div className="fb-intent-footer">
        <span className={`fb-word-count ${wcOk ? 'fb-word-count--ok' : ''}`}>
          {wcOk ? T.intent.wordCountOk(wc) : T.intent.wordCount(wc) + ` / ${MIN_WORDS}`}
        </span>

        <button
          className="fb-btn fb-btn--ghost"
          onClick={onCancel}
          disabled={loading}
        >
          {T.intent.cancelBtn}
        </button>

        <button
          className="fb-btn fb-btn--primary"
          onClick={handleSubmit}
          disabled={!wcOk || loading}
        >
          {loading ? '...' : T.intent.submitBtn}
        </button>
      </div>
    </div>
  );
}
