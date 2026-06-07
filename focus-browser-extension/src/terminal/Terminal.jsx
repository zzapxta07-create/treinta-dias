import { useState, useEffect, useRef, useCallback } from 'react';
import { t } from '../i18n/index.js';
import { parseCommand } from './commandParser.js';
import {
  DEFAULT_COMMANDS, DEFAULT_DISTRACTORS,
  BUILTIN_COMMANDS, NO_FRICTION_COMMANDS, isValidUrl, isDistractorUrl,
} from './commandRegistry.js';
import {
  loadCustomCommands, saveCommand, removeCommand, countCustomCommands,
} from '../storage/commandsStorage.js';
import { loadHistory } from '../storage/historyStorage.js';
import { loadStats } from '../storage/statsStorage.js';

const PROMPT = 'fb> ';

function buildWelcome(T) {
  return T.terminal.welcome.map(text => ({ type: 'dim', text }));
}

function line(type, text) { return { type, text }; }
const out  = t => line('output', t);
const err  = t => line('error',  t);
const info = t => line('info',   t);
const dim  = t => line('dim',    t);

function fmtFocusTime(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Terminal({ onOpenUrl }) {
  const [output,     setOutput]     = useState(() => buildWelcome(t()));
  const [inputVal,   setInputVal]   = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [histIdx,    setHistIdx]    = useState(-1);
  const [customCmds, setCustomCmds] = useState({});
  const [focusTimer, setFocusTimer] = useState(null); // { endTime: ms, minutes: n }
  const [timerLabel, setTimerLabel] = useState('');

  const outputRef = useRef(null);
  const inputRef  = useRef(null);

  // Load custom commands on mount
  useEffect(() => {
    loadCustomCommands().then(setCustomCmds);
    inputRef.current?.focus();
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Focus timer tick
  useEffect(() => {
    if (!focusTimer) { setTimerLabel(''); return; }
    const tick = () => {
      const remaining = focusTimer.endTime - Date.now();
      if (remaining <= 0) {
        setFocusTimer(null);
        setTimerLabel('');
        appendLines([info(t().focus.done)]);
      } else {
        setTimerLabel(t().focus.running(fmtFocusTime(remaining)));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [focusTimer]);

  // Click anywhere → focus input
  function handleWrapperClick() { inputRef.current?.focus(); }

  function appendLines(lines) {
    setOutput(prev => [...prev, ...lines]);
  }

  function clearOutput() {
    setOutput(buildWelcome(t()));
  }

  // ── Command execution ──────────────────────────────────────────────────

  const executeCommand = useCallback(async (parsed) => {
    const { cmd, args } = parsed;
    const T = t();

    switch (cmd) {

      case 'help':
        appendLines(T.help.map(dim));
        break;

      case 'manual':
        appendLines(T.manual.map(dim));
        break;

      case 'clear':
        clearOutput();
        break;

      case 'open': {
        const name = args[0]?.toLowerCase();
        if (!name) { appendLines([err('Uso: open <comando>')]); break; }
        const allCmds = { ...DEFAULT_COMMANDS, ...customCmds };
        const url = allCmds[name];
        if (!url) { appendLines([err(T.terminal.commandNotFound(name))]); break; }
        onOpenUrl(url, { command: name, type: 'open', isDistractor: isDistractorUrl(url), noFriction: NO_FRICTION_COMMANDS.has(name) });
        break;
      }

      case 'visit': {
        const rawUrl = args[0];
        if (!rawUrl) { appendLines([err('Uso: visit <url>')]); break; }
        const url = rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl;
        if (!isValidUrl(url)) { appendLines([err(T.terminal.invalidUrl)]); break; }
        const isDistractor = isDistractorUrl(url);
        onOpenUrl(url, { command: 'visit', type: 'visit', isDistractor });
        break;
      }

      case 'save-command': {
        const [name, rawUrl] = args;
        if (!name || !rawUrl) { appendLines([err('Uso: save-command <nombre> <url>')]); break; }
        const url = rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl;
        if (!isValidUrl(url)) { appendLines([err(T.terminal.invalidUrl)]); break; }
        const nameLower = name.toLowerCase();
        if (BUILTIN_COMMANDS.has(nameLower) || DEFAULT_COMMANDS[nameLower]) {
          appendLines([err(T.commands.alreadyExists(name))]); break;
        }
        if (customCmds[nameLower]) { appendLines([err(T.commands.alreadyExists(name))]); break; }
        await saveCommand(nameLower, url);
        const updated = await loadCustomCommands();
        setCustomCmds(updated);
        appendLines([info(T.commands.saved(name, url))]);
        break;
      }

      case 'remove-command': {
        const nameLower = args[0]?.toLowerCase();
        if (!nameLower) { appendLines([err('Uso: remove-command <nombre>')]); break; }
        if (!customCmds[nameLower]) { appendLines([err(T.commands.notFound(args[0]))]); break; }
        await removeCommand(nameLower);
        const updated = await loadCustomCommands();
        setCustomCmds(updated);
        appendLines([info(T.commands.removed(args[0]))]);
        break;
      }

      case 'commands': {
        const lines = [dim(T.commands.headerBuiltin)];
        for (const [name, url] of Object.entries(DEFAULT_COMMANDS)) {
          const flag = isDistractorUrl(url) ? T.commands.distractor : '';
          lines.push(dim(`  ${name.padEnd(14)} ${url}${flag}`));
        }
        if (Object.keys(customCmds).length > 0) {
          lines.push(dim(T.commands.headerCustom));
          for (const [name, url] of Object.entries(customCmds)) {
            const flag = isDistractorUrl(url) ? T.commands.distractor : '';
            lines.push(dim(`  ${name.padEnd(14)} ${url}${flag}`));
          }
        } else {
          lines.push(dim(T.commands.headerCustom));
          lines.push(dim(T.commands.empty));
        }
        lines.push(dim(T.commands.footer));
        appendLines(lines);
        break;
      }

      case 'history': {
        const hist = await loadHistory();
        if (hist.length === 0) {
          appendLines([dim(T.history.header), dim(T.history.empty), dim(T.history.footer)]);
        } else {
          const lines = [dim(T.history.header)];
          const recent = hist.slice(0, 50);
          for (const h of recent) {
            const d = new Date(h.timestamp);
            const dateStr = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
            const cancelled = h.completed === false ? T.history.cancelled : '';
            const dist = h.isDistractor ? T.history.distractor : '';
            const cmd = h.command?.padEnd(14) || '?'.padEnd(14);
            const urlShort = h.url?.length > 45 ? h.url.slice(0, 42) + '...' : (h.url || '?');
            lines.push(dim(`  ${dateStr}  ${cmd}  ${urlShort}${cancelled}${dist}`));
          }
          lines.push(dim(T.history.footer));
          appendLines(lines);
        }
        break;
      }

      case 'stats': {
        const stats = await loadStats();
        const T2 = t().stats;
        if (!stats.totalOpens) {
          appendLines([dim(T2.header), dim(T2.none), dim(T2.footer)]);
          break;
        }
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        const weekOpens = Object.values(stats.weeklyOpens || {}).reduce((a,b) => a+b, 0);
        const topSites = Object.entries(stats.siteFrequency || {})
          .sort((a,b) => b[1]-a[1]).slice(0, 3)
          .map(([s,n]) => `${s} (${n})`).join(', ') || '—';
        const customCount = await countCustomCommands();

        const lines = [
          dim(T2.header),
          dim(`  ${T2.today.padEnd(26)} ${stats.dailyOpens?.[todayKey] || 0}`),
          dim(`  ${T2.week.padEnd(26)} ${weekOpens}`),
          dim(`  ${T2.topSites.padEnd(26)} ${topSites}`),
          dim(`  ${T2.distractors.padEnd(26)} ${stats.distractorOpens || 0}`),
          dim(`  ${T2.intentions.padEnd(26)} ${stats.intentionsWritten || 0}`),
          dim(`  ${T2.cancelled.padEnd(26)} ${stats.cancelledFlows || 0}`),
          dim(`  ${T2.customCmds.padEnd(26)} ${customCount}`),
          dim(`  ${T2.visitVsOpen.padEnd(26)} ${stats.visitCount || 0} / ${stats.openCount || 0}`),
          dim(T2.footer),
        ];
        appendLines(lines);
        break;
      }

      case 'focus': {
        const mins = parseInt(args[0]);
        if (!args[0] || isNaN(mins) || mins < 1 || mins > 120) {
          appendLines([err(T.focus.invalidTime)]); break;
        }
        if (focusTimer) { appendLines([err(T.focus.alreadyRunning)]); break; }
        const endTime = Date.now() + mins * 60 * 1000;
        setFocusTimer({ endTime, minutes: mins });
        appendLines([info(T.focus.started(mins))]);
        break;
      }

      case 'stop-focus': {
        if (!focusTimer) { appendLines([err(T.focus.notRunning)]); break; }
        setFocusTimer(null);
        appendLines([info(T.focus.stopped)]);
        break;
      }

      case 'lang': {
        const newLang = args[0]?.toLowerCase();
        if (newLang !== 'es' && newLang !== 'en') {
          appendLines([err(T.lang.invalid)]); break;
        }
        const { setLanguage } = await import('../i18n/index.js');
        setLanguage(newLang);
        appendLines([info(t().lang.changed(newLang))]);
        setOutput(prev => [...prev]);
        break;
      }

      default:
        appendLines([err(T.terminal.unknownCommand(cmd))]);
    }
  }, [customCmds, focusTimer, onOpenUrl]);

  // ── Input handlers ─────────────────────────────────────────────────────

  function handlePaste(e) {
    const text = e.clipboardData?.getData('text')?.trim();
    if (!text) return;
    const isUrl = text.startsWith('http://') || text.startsWith('https://') || /^[\w-]+\.[a-z]{2,}(\/|$)/i.test(text);
    if (isUrl) {
      e.preventDefault();
      setInputVal('visit ' + text);
      setHistIdx(-1);
    }
  }
  function handleContextMenu(e) { e.preventDefault(); }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = inputVal.trim();
      appendLines([line('input', PROMPT + val)]);
      setCmdHistory(prev => val ? [val, ...prev.slice(0, 49)] : prev);
      setHistIdx(-1);
      setInputVal('');
      if (val) {
        const parsed = parseCommand(val);
        if (parsed) executeCommand(parsed);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIdx = Math.min(histIdx + 1, cmdHistory.length - 1);
      setHistIdx(newIdx);
      setInputVal(cmdHistory[newIdx] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIdx = Math.max(histIdx - 1, -1);
      setHistIdx(newIdx);
      setInputVal(newIdx === -1 ? '' : (cmdHistory[newIdx] ?? ''));
    }
  }

  const T = t();

  return (
    <div className="fb-wrapper" onClick={handleWrapperClick}>
      <header className="fb-header">
        <span className="fb-header-brand">Focus Browser</span>
        <span className="fb-header-sep">·</span>
        <span className="fb-header-status">{PROMPT}</span>
        {timerLabel && <span className="fb-header-timer">{timerLabel}</span>}
      </header>

      <div ref={outputRef} className="fb-output">
        {output.map((entry, i) => (
          <span key={i} className={`fb-line fb-line--${entry.type}`}>
            {entry.text || ' '}
          </span>
        ))}
      </div>

      <div className="fb-input-row">
        <span className="fb-prompt">{PROMPT}</span>
        <input
          ref={inputRef}
          type="text"
          className="fb-input"
          value={inputVal}
          onChange={e => { setInputVal(e.target.value); setHistIdx(-1); }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onContextMenu={handleContextMenu}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          aria-label="Terminal input"
        />
      </div>
    </div>
  );
}
