import { useState, useEffect, useRef } from 'react';
import { t, getLanguage } from '../i18n/index.js';
import { getRandomPhrases } from './loadingMessages.js';

const DURATION = 10;

export default function LoadingScreen({ url, onComplete }) {
  const [seconds,   setSeconds]   = useState(DURATION);
  const [phrases,   setPhrases]   = useState([]);
  const [visible,   setVisible]   = useState([false, false]);
  const doneRef = useRef(false);

  useEffect(() => {
    const lang = getLanguage();
    setPhrases(getRandomPhrases(lang, 2));

    // Reveal phrases with slight delay for visual effect
    const t1 = setTimeout(() => setVisible([true, false]), 600);
    const t2 = setTimeout(() => setVisible([true, true]),  2000);

    const interval = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(interval);
          if (!doneRef.current) {
            doneRef.current = true;
            setTimeout(onComplete, 300);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const T = t();
  const progress = ((DURATION - seconds) / DURATION) * 100;

  return (
    <div className="fb-loading">
      <h1 className="fb-loading-heading">{T.loading.heading}</h1>
      <p className="fb-loading-url">{T.loading.opening(url)}</p>

      <div className="fb-loading-bar-wrap">
        <div className="fb-loading-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="fb-loading-countdown">{seconds}</div>

      <div className="fb-loading-phrases">
        {phrases.map((phrase, i) => (
          <p
            key={i}
            className={`fb-loading-phrase ${visible[i] ? 'fb-loading-phrase--visible' : ''}`}
          >
            "{phrase}"
          </p>
        ))}
      </div>
    </div>
  );
}
