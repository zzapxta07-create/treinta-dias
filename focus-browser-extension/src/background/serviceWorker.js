// Focus Browser — Service Worker (MV3)

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
// Session rules share the same ID space as dynamic rules; use a high offset
const SESSION_RULE_OFFSET = 100000;

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

function getBaseDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch { return ''; }
}

function isAllowedDomain(url) {
  const host = getBaseDomain(url);
  return ALLOWED_DOMAINS.some(d => host === d || host.endsWith('.' + d));
}

// ── Per-tab session allow-rules ───────────────────────────────────────────────
// Session rules have priority 100 (> blocking rules at priority 1).
// They survive SW sleep/wake but are cleared on browser restart.
// chrome.storage.session mirrors the state for cleanup on navigation/tab close.

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
});

chrome.runtime.onStartup.addListener(async () => {
  const data = await chrome.storage.local.get('fb_distractors');
  await setupDistractorRules(data.fb_distractors || DEFAULT_DISTRACTORS);
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
});

async function navigateToUrl(url, isDistractor, fromTabId) {
  const targetTabId = fromTabId || await getActiveTabId();
  if (!targetTabId) return;

  if (isDistractor) {
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    const matchingRule = getRuleForUrl(rules, url);
    if (matchingRule) {
      const domain = matchingRule.condition.urlFilter.replace('||', '');
      // Session rule allows this tab to navigate + refresh freely on this domain
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
// tabs.onCreated fires before declarativeNetRequest, so we can redirect first.

chrome.tabs.onCreated.addListener(async (tab) => {
  const url = tab.pendingUrl || tab.url || '';
  if (!url.startsWith('http')) return;
  if (isAllowedDomain(url)) return;
  try { if (SEARCH_ENGINE_RE.test(new URL(url).hostname)) return; } catch {}

  if (tab.openerTabId) {
    // Link opened from another tab: check if it's a distractor
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    const matchingRule = getRuleForUrl(rules, url);
    if (matchingRule) {
      // Allow via session rule so declarativeNetRequest doesn't block it
      const domain = matchingRule.condition.urlFilter.replace('||', '');
      await addSessionAllowRule(tab.id, domain);
    }
    return; // skip intent gate for any link click
  }

  // Direct navigation (no opener) → show intent gate
  const newtabUrl = chrome.runtime.getURL(`newtab.html?url=${encodeURIComponent(url)}`);
  chrome.tabs.update(tab.id, { url: newtabUrl });
});

// ── Session rule cleanup ─────────────────────────────────────────────────────

// Remove session rule when tab navigates away from the allowed distractor domain
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (!changeInfo.url) return; // refresh doesn't change URL — keep rule intact
  const allowedDomain = await getTabAllowedDomain(tabId);
  if (!allowedDomain) return;

  const newHost = getBaseDomain(changeInfo.url);
  const stillOnDomain = newHost === allowedDomain || newHost.endsWith('.' + allowedDomain);
  if (!stillOnDomain) {
    await removeSessionAllowRule(tabId);
  }
});

// Remove session rule when tab closes
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const allowedDomain = await getTabAllowedDomain(tabId);
  if (allowedDomain) await removeSessionAllowRule(tabId);
});
