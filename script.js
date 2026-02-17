const statusText = document.getElementById('statusText');
const statusDot = document.getElementById('statusDot');
const lastShipText = document.getElementById('lastShipText');
const year = document.getElementById('year');

if (year) year.textContent = String(new Date().getFullYear());

const GITHUB_USER = 'ArhanCodes';
const CODING_WINDOW_HOURS = 6;
const API_TIMEOUT_MS = 10000; // 10s timeout for API calls

function msHours(h) {
  return h * 60 * 60 * 1000;
}

function fmtAgo(date) {
  const ms = Date.now() - date.getTime();
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function sanitizeText(x) {
  return String(x || '').replace(/\s+/g, ' ').trim();
}

/** Fetch with a timeout to avoid hanging requests */
function fetchWithTimeout(url, opts = {}, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function loadActivitySignals() {
  if (!statusText || !statusDot) return;

  const cacheKey = 'gh_activity_cache_v1';
  const cacheMs = 5 * 60 * 1000; // 5 min

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached && Date.now() - cached.ts < cacheMs && cached.data) {
      applyActivitySignals(cached.data);
      return;
    }
  } catch {
    // corrupted cache — clear it
    try { localStorage.removeItem(cacheKey); } catch { /* ignore */ }
  }

  try {
    const url = `https://api.github.com/users/${encodeURIComponent(GITHUB_USER)}/events/public?per_page=30`;
    const res = await fetchWithTimeout(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(`GitHub API error (${res.status})`);

    const events = await res.json();

    const push = events.find((e) => e && e.type === 'PushEvent' && e.created_at);
    const latestAny = events.find((e) => e && e.created_at);

    const data = {
      pushCreatedAt: push?.created_at || null,
      pushRepo: push?.repo?.name || null,
      pushCommitMsg: push?.payload?.commits?.[0]?.message || null,
      latestEventAt: latestAny?.created_at || null,
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
    } catch {
      // storage full — ignore
    }

    applyActivitySignals(data);
  } catch (err) {
    statusText.textContent = 'Activity signal unavailable (offline / rate limit).';
    if (lastShipText) lastShipText.textContent = '';
  }
}

function applyActivitySignals(data) {
  const pushAt = data?.pushCreatedAt ? new Date(data.pushCreatedAt) : null;
  const isActive = pushAt && Date.now() - pushAt.getTime() <= msHours(CODING_WINDOW_HOURS);

  if (isActive) {
    statusText.textContent = `Actively coding \u2014 last pushed ${fmtAgo(pushAt)}`;
    statusDot.classList.add('good');
    statusDot.setAttribute('aria-label', 'Active');
  } else if (pushAt) {
    statusText.textContent = `Not coding right now (last push ${fmtAgo(pushAt)})`;
    statusDot.classList.remove('good');
    statusDot.setAttribute('aria-label', 'Inactive');
  } else {
    statusText.textContent = 'No recent push events found.';
    statusDot.classList.remove('good');
    statusDot.setAttribute('aria-label', 'Unknown');
  }

  if (lastShipText) {
    if (pushAt) {
      const repo = sanitizeText(data.pushRepo);
      const msg = sanitizeText(data.pushCommitMsg);
      const left = repo ? `Last shipped: ${repo}` : 'Last shipped:';
      lastShipText.textContent = msg ? `${left} \u2014 "${msg}"` : left;
    } else {
      lastShipText.textContent = '';
    }
  }
}

loadActivitySignals();

// --- GitHub pinned repo preview ---
const repoGrid = document.getElementById('repoGrid');
const repoHint = document.getElementById('repoHint');


const PINNED_REPOS = [
  { owner: 'tradebuddyhq', name: 'app',          description: 'React native app for mytradebuddy.com',  language: 'JavaScript' },
  { owner: 'tradebuddyhq', name: 'ebay-wrapper',  description: 'Updated eBay API Wrapper',               language: 'TypeScript' },
  { owner: 'ArhanCodes',   name: 'carbontrack',    description: 'School level carbon emissions dashboard', language: 'JavaScript' },
  { owner: 'ArhanCodes',   name: 'Otter',          description: 'A powerful discord moderation bot',      language: 'TypeScript' },
  { owner: 'IKEAStock',    name: 'api',            description: 'api.ikeastock.app',                      language: 'TypeScript' },
  { owner: 'ArhanCodes',   name: 'web',            description: 'arhan.dev',                              language: 'JavaScript' },
];

function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v);
  }
  for (const c of children) e.appendChild(c);
  return e;
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

/** Fetch live data for a single repo from REST API */
async function fetchRepoData(owner, name) {
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const res = await fetchWithTimeout(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) return null;
  return res.json();
}

async function loadRepos() {
  if (!repoGrid) return;

  // Timeout so skeletons don't stay forever
  const timeoutId = setTimeout(() => {
    if (repoGrid.querySelector('.repo-skeleton')) {
      // Even if REST fails, render pinned repos with static data
      renderRepos(PINNED_REPOS.map((p) => ({
        name: p.owner === 'ArhanCodes' ? p.name : `${p.owner}/${p.name}`,
        description: p.description,
        html_url: `https://github.com/${p.owner}/${p.name}`,
        stargazers_count: 0,
        language: p.language,
        updated_at: null,
      })));
    }
  }, API_TIMEOUT_MS);

  // Fetch live data for all pinned repos in parallel
  const results = await Promise.allSettled(
    PINNED_REPOS.map((p) => fetchRepoData(p.owner, p.name))
  );

  clearTimeout(timeoutId);

  const repos = PINNED_REPOS.map((p, i) => {
    const live = results[i].status === 'fulfilled' ? results[i].value : null;
    return {
      name: p.owner === 'ArhanCodes' ? p.name : `${p.owner}/${p.name}`,
      description: live?.description || p.description,
      html_url: live?.html_url || `https://github.com/${p.owner}/${p.name}`,
      stargazers_count: live?.stargazers_count ?? 0,
      language: live?.language || p.language,
      updated_at: live?.updated_at || null,
    };
  });

  renderRepos(repos);
}

function renderRepos(repos) {
  repoGrid.replaceChildren();

  for (const r of repos) {
    const right = el('span', { class: 'badge', text: r.language || 'Repo' });
    const top = el('div', { class: 'repo-top' }, [
      el('span', { class: 'repo-name', text: r.name }),
      right,
    ]);

    const metaBadges = [
      el('span', { class: 'badge', text: `\u2605 ${r.stargazers_count}` }),
    ];
    if (r.updated_at) {
      metaBadges.push(el('span', { class: 'badge', text: `Updated ${fmtDate(r.updated_at)}` }));
    }
    const meta = el('div', { class: 'repo-meta' }, metaBadges);

    const desc = el('div', { class: 'repo-desc', text: r.description || '\u2014' });

    const card = el('a', {
      class: 'repo',
      href: r.html_url,
      target: '_blank',
      rel: 'noreferrer',
      role: 'listitem',
      'aria-label': `${r.name} repository`,
    }, [top, desc, meta]);

    repoGrid.appendChild(card);
  }

  if (repoHint) {
    repoHint.style.display = 'block';
  }
}

loadRepos();
