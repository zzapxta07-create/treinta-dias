// Focus Browser — Service Worker (MV3)
// Responsibilities:
//   1. Set up declarativeNetRequest rules for distractor sites
//   2. Handle NAVIGATE_URL messages from the terminal (bypass + navigate)
//   3. Reset rules after navigation completes

const DEFAULT_DISTRACTORS = [
  'twitter.com', 'x.com',
  'instagram.com', 'tiktok.com', 'facebook.com', 'netflix.com',
];

// Domains that bypass the intent gate entirely (open directly like normal browsing)
const ALLOWED_DOMAINS = [
  'reddit.com', 'redd.it', 'redditstatic.com', 'redditmedia.com',
];

// Search engines and utility sites — never gated
const SEARCH_ENGINE_RE = /^(www\.)?(google\.[a-z]{2,6}(\.[a-z]{2})?|bing\.com|duckduckgo\.com|search\.yahoo\.com|ecosia\.org|brave\.com)$/;

const RULE_BASE_ID = 200;

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
    return true; // keep channel open for async
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
      // Remove rule temporarily so navigation isn't intercepted
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [matchingRule.id],
      });

      // Navigate
      await chrome.tabs.update(targetTabId, { url });

      // Restore rule once the tab finishes loading
      const ruleToRestore = matchingRule;
      let restored = false;
      const onUpdated = (tabId, changeInfo) => {
        if (tabId === targetTabId && changeInfo.status === 'complete' && !restored) {
          restored = true;
          chrome.tabs.onUpdated.removeListener(onUpdated);
          chrome.declarativeNetRequest.updateDynamicRules({
            addRules: [ruleToRestore],
          }).catch(() => {});
        }
      };
      chrome.tabs.onUpdated.addListener(onUpdated);

      // Fallback: restore after 8 seconds in case listener fires late
      chrome.alarms.create('restore_rule_' + matchingRule.id, { delayInMinutes: 8 / 60 });
      return;
    }
  }

  await chrome.tabs.update(targetTabId, { url });
}

async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id || null;
}

// ── Intent gate for links opened in new tabs ─────────────────────────────────
// Redirect immediately in onCreated so we beat declarativeNetRequest blocking.
// pendingUrl is populated when a link is Ctrl+Clicked or opened via target="_blank".
// Empty-URL tabs (Ctrl+T, typed URLs) have pendingUrl='' so they're skipped.

function getBaseDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch { return ''; }
}

function isAllowedDomain(url) {
  const host = getBaseDomain(url);
  return ALLOWED_DOMAINS.some(d => host === d || host.endsWith('.' + d));
}

chrome.tabs.onCreated.addListener(async (tab) => {
  const url = tab.pendingUrl || tab.url || '';
  if (!url.startsWith('http')) return;

  // Whitelisted domains and search engines open freely
  if (isAllowedDomain(url)) return;
  try { if (SEARCH_ENGINE_RE.test(new URL(url).hostname)) return; } catch {}


  // Same-domain links open freely (e.g. YouTube → YouTube, GitHub → GitHub)
  if (tab.openerTabId) {
    try {
      const opener = await chrome.tabs.get(tab.openerTabId);
      if (getBaseDomain(opener.url) === getBaseDomain(url)) return;
    } catch {}
  }

  const newtabUrl = chrome.runtime.getURL(`newtab.html?url=${encodeURIComponent(url)}`);
  chrome.tabs.update(tab.id, { url: newtabUrl });
});

// Alarm handler for rule restoration fallback
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('restore_rule_')) {
    const ruleId = parseInt(alarm.name.replace('restore_rule_', ''));
    if (isNaN(ruleId)) return;

    // Check if rule is missing and restore if needed
    const data = await chrome.storage.local.get('fb_distractors');
    const distractors = data.fb_distractors || DEFAULT_DISTRACTORS;
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    const exists = rules.some(r => r.id === ruleId);

    if (!exists) {
      const idx = ruleId - RULE_BASE_ID;
      if (idx >= 0 && idx < distractors.length) {
        const rule = buildRules(distractors)[idx];
        if (rule) {
          await chrome.declarativeNetRequest.updateDynamicRules({ addRules: [rule] }).catch(() => {});
        }
      }
    }
  }
});
