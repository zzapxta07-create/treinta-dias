// Focus Browser — Service Worker (MV3)

import { loadLimits, matchLimit, loadTodayUsage, incrementUsage } from '../storage/usageStorage.js';

const DEFAULT_DISTRACTORS = [
  'twitter.com', 'x.com',
  'instagram.com', 'tiktok.com', 'facebook.com', 'netflix.com',
];

// Domains that bypass the intent gate entirely
const ALLOWED_DOMAINS = [
  'reddit.com', 'redd.it', 'redditstatic.com', 'redditmedia.com',
];

// Search engines — never gated
const SEARCH_ENGINE_RE = /^(www\.)?(google\.[a-z]{2,6}(\.[a-z]{2})?|bing\.com|duckduckgo\.com|search\.yahoo\.com|ecosia\.org|brave\.com)$/;

const RULE_BASE_ID = 200;
// Per-app (per-site) daily time-limit block rules live in their own ID range
// so rebuilding them never touches the distractor rules above.
const LIMIT_RULE_BASE_ID = 2000;
const LIMIT_RULE_MAX     = 1000; // headroom for up to 1000 limited domains
// Session rules share the same ID space as dynamic rules; use a high offset
const SESSION_RULE_OFFSET = 100000;

// Module-level cache so isDistractorUrl() is synchronous (avoids await in time-sensitive handlers)
let cachedDistractors = DEFAULT_DISTRACTORS;
chrome.storage.local.get('fb_distractors').then(d => {
  if (d.fb_distractors) cachedDistractors = d.fb_distractors;
}).catch(() => {});

// ── Rule helpers ──────────────────────────────────────────────────────────────

function buildRules(distractors) {
  return distractors.map((domain, i) => ({
    id: RULE_BASE_ID + i,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: { extensionPath: '/newtab.html?blocked=1' },
    },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: ['main_frame'],
    },
  }));
}

async function setupDistractorRules(distractors = DEFAULT_DISTRACTORS) {
  cachedDistractors = distractors;
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const existingIds = existing.map(r => r.id);
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds,
      addRules: buildRules(distractors),
    });
  } catch (e) {
    console.error('[FocusBrowser] Failed to set rules:', e);
  }
}

function getBaseDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch { return ''; }
}

function isAllowedDomain(url) {
  const host = getBaseDomain(url);
  return ALLOWED_DOMAINS.some(d => host === d || host.endsWith('.' + d));
}

// Returns the matching distractor domain string, or null. Synchronous — uses cache.
function matchDistractor(url) {
  const host = getBaseDomain(url);
  return cachedDistractors.find(d => host === d || host.endsWith('.' + d)) || null;
}

function getRuleForUrl(rules, url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return rules.find(r => {
      const domain = r.condition.urlFilter.replace('||', '');
      return host === domain || host.endsWith('.' + domain);
    });
  } catch {
    return null;
  }
}

// ── Per-app (per-site) daily usage limits ───────────────────────────────────────

function buildLimitRules(domains) {
  return domains.map((domain, i) => ({
    id: LIMIT_RULE_BASE_ID + i,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: { extensionPath: `/newtab.html?limited=1&domain=${encodeURIComponent(domain)}` },
    },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: ['main_frame'],
    },
  }));
}

// Rebuilds the block rules for domains that have hit their daily limit today.
// Only touches the LIMIT_RULE_BASE_ID+ range so distractor rules are untouched.
async function setupLimitRules(domains) {
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const existingLimitIds = existing
      .map(r => r.id)
      .filter(id => id >= LIMIT_RULE_BASE_ID && id < LIMIT_RULE_BASE_ID + LIMIT_RULE_MAX);
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingLimitIds,
      addRules: buildLimitRules(domains.slice(0, LIMIT_RULE_MAX)),
    });
  } catch (e) {
    console.error('[FocusBrowser] Failed to set limit rules:', e);
  }
}

// Recomputes which domains are currently over their daily limit and syncs the
// block rules. Called after limits/usage change and on every extension wake.
async function recomputeLimitRules() {
  const [limits, usage] = await Promise.all([loadLimits(), loadTodayUsage()]);
  const overLimit = Object.entries(limits)
    .filter(([domain, minutes]) => (usage[domain] || 0) >= minutes)
    .map(([domain]) => domain);
  await setupLimitRules(overLimit);
  return overLimit;
}

// ── Active-tab usage tracking ────────────────────────────────────────────────
// MV3 service workers are ephemeral, so we use a 1-minute chrome.alarms tick
// instead of setInterval, and re-derive "what's the active tab right now"
// from the browser directly each tick rather than trusting cached state.

const USAGE_ALARM = 'fb-usage-tick';

let chromeHasFocus = true;
chrome.windows.onFocusChanged.addListener((windowId) => {
  chromeHasFocus = windowId !== chrome.windows.WINDOW_ID_NONE;
});

async function tickUsage() {
  try {
    if (!chromeHasFocus) return;
    const idleState = await chrome.idle.queryState(60);
    if (idleState !== 'active') return;

    const win = await chrome.windows.getLastFocused({ populate: true, windowTypes: ['normal'] }).catch(() => null);
    const activeTab = win?.tabs?.find(t => t.active);
    if (!activeTab?.url || !activeTab.url.startsWith('http')) return;

    const host = getBaseDomain(activeTab.url);
    const limits = await loadLimits();
    const domain = matchLimit(host, limits);
    if (!domain) return;

    const newTotal = await incrementUsage(domain, 1);
    if (newTotal >= limits[domain]) {
      await recomputeLimitRules();
      // DNR only stops future navigations — kick the tab off the page now too.
      if (getBaseDomain(activeTab.url) === domain || host === domain) {
        chrome.tabs.update(activeTab.id, {
          url: chrome.runtime.getURL(`newtab.html?limited=1&domain=${encodeURIComponent(domain)}`),
        }).catch(() => {});
      }
    }
  } catch (e) {
    console.error('[FocusBrowser] tickUsage failed:', e);
  }
}

// ── Per-tab session allow-rules ───────────────────────────────────────────────
// Priority 100 beats DNR blocking rules (priority 1).
// Scoped to a specific tabId so only that tab is exempted.

async function addSessionAllowRule(tabId, domain) {
  const ruleId = SESSION_RULE_OFFSET + tabId;
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [ruleId],
    addRules: [{
      id: ruleId,
      priority: 100,
      action: { type: 'allow' },
      condition: {
        urlFilter: `||${domain}`,
        resourceTypes: ['main_frame'],
        tabIds: [tabId],
      },
    }],
  }).catch(() => {});
  await chrome.storage.session.set({ [`tab_${tabId}`]: domain }).catch(() => {});
}

async function removeSessionAllowRule(tabId) {
  const ruleId = SESSION_RULE_OFFSET + tabId;
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [ruleId],
  }).catch(() => {});
  await chrome.storage.session.remove(`tab_${tabId}`).catch(() => {});
}

async function getTabAllowedDomain(tabId) {
  const data = await chrome.storage.session.get(`tab_${tabId}`);
  return data[`tab_${tabId}`] || null;
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get('fb_distractors');
  await setupDistractorRules(data.fb_distractors || DEFAULT_DISTRACTORS);
  await recomputeLimitRules();
  chrome.alarms.create(USAGE_ALARM, { periodInMinutes: 1 });
});

chrome.runtime.onStartup.addListener(async () => {
  const data = await chrome.storage.local.get('fb_distractors');
  await setupDistractorRules(data.fb_distractors || DEFAULT_DISTRACTORS);
  await recomputeLimitRules();
  chrome.alarms.create(USAGE_ALARM, { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === USAGE_ALARM) tickUsage();
});

// ── Message handling ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'NAVIGATE_URL') {
    navigateToUrl(msg.url, msg.isDistractor, sender.tab?.id)
      .then(() => sendResponse({ ok: true }))
      .catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }

  if (msg.type === 'UPDATE_DISTRACTORS') {
    setupDistractorRules(msg.distractors)
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (msg.type === 'UPDATE_LIMITS') {
    recomputeLimitRules()
      .then((overLimit) => sendResponse({ ok: true, overLimit }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }
});

async function navigateToUrl(url, isDistractor, fromTabId) {
  const targetTabId = fromTabId || await getActiveTabId();
  if (!targetTabId) return;

  if (isDistractor) {
    const domain = matchDistractor(url);
    if (domain) {
      await addSessionAllowRule(targetTabId, domain);
    }
  }

  await chrome.tabs.update(targetTabId, { url });
}

async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id || null;
}

// ── Intent gate for new tabs ─────────────────────────────────────────────────
// tabs.onCreated fires before declarativeNetRequest processes the navigation,
// giving us a window to redirect or set a session rule.
//
// CRITICAL: any chrome API await() in this handler can lose the race against DNR.
// For distractor links opened from another tab, we immediately redirect to
// about:blank (no await — enqueued synchronously) to cancel the original
// navigation, then async-add the session rule, then re-navigate.

chrome.tabs.onCreated.addListener(async (tab) => {
  const url = tab.pendingUrl || tab.url || '';
  if (!url.startsWith('http')) return;
  if (isAllowedDomain(url)) return;
  try { if (SEARCH_ENGINE_RE.test(new URL(url).hostname)) return; } catch {}

  if (tab.openerTabId) {
    const distractor = matchDistractor(url); // synchronous — no await
    if (distractor) {
      // Synchronously cancel the original navigation before DNR intercepts it,
      // then add the session allow-rule and re-navigate.
      chrome.tabs.update(tab.id, { url: 'about:blank' }); // no await — beats DNR
      await addSessionAllowRule(tab.id, distractor);
      chrome.tabs.update(tab.id, { url });                 // session rule is now active
    }
    return; // skip intent gate for any link click
  }

  // Direct navigation (typed URL, Ctrl+T) — show intent gate
  chrome.tabs.update(tab.id, { url: chrome.runtime.getURL(`newtab.html?url=${encodeURIComponent(url)}`) });
});

// ── Session rule cleanup ─────────────────────────────────────────────────────

// Revoke session allow-rule only when navigation is fully complete.
// Using status='complete' + tab.url (final URL) avoids false-positive removal
// during redirect chains where intermediate URLs may not match the allowed domain.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  const allowedDomain = await getTabAllowedDomain(tabId);
  if (!allowedDomain) return;

  const finalHost = getBaseDomain(tab.url || '');
  const stillOnDomain = finalHost === allowedDomain || finalHost.endsWith('.' + allowedDomain);
  if (!stillOnDomain) {
    await removeSessionAllowRule(tabId);
  }
});

// Revoke session allow-rule when the tab is closed.
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const allowedDomain = await getTabAllowedDomain(tabId);
  if (allowedDomain) await removeSessionAllowRule(tabId);
});
