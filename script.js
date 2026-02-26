const GITHUB_USER = 'ArhanCodes';
const CODING_WINDOW_HOURS = 1;
const API_TIMEOUT_MS = 10000;

/* ---- Time display ---- */
const timeDisplay = document.getElementById('timeDisplay');

function updateTime() {
  if (!timeDisplay) return;
  timeDisplay.textContent = new Date().toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

updateTime();
setInterval(updateTime, 15000);

/* ---- GitHub activity status ---- */
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

function msHours(h) {
  return h * 60 * 60 * 1000;
}

function fetchWithTimeout(url, opts = {}, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

async function loadStatus() {
  if (!statusText || !statusDot) return;

  const cacheKey = 'gh_activity_cache_v2';
  const cacheMs = 5 * 60 * 1000;

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached && Date.now() - cached.ts < cacheMs && cached.data) {
      applyStatus(cached.data);
      return;
    }
  } catch {
    try { localStorage.removeItem(cacheKey); } catch { /* ignore */ }
  }

  try {
    const url = `https://api.github.com/users/${encodeURIComponent(GITHUB_USER)}/events/public?per_page=30`;
    const res = await fetchWithTimeout(url, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);

    const events = await res.json();
    const push = events.find(e => e && e.type === 'PushEvent' && e.created_at);

    const data = { pushCreatedAt: push?.created_at || null };

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
    } catch { /* storage full */ }

    applyStatus(data);
  } catch {
    statusText.textContent = 'offline';
    statusDot.classList.remove('online');
  }
}

function applyStatus(data) {
  const pushAt = data?.pushCreatedAt ? new Date(data.pushCreatedAt) : null;
  const isActive = pushAt && (Date.now() - pushAt.getTime()) <= msHours(CODING_WINDOW_HOURS);

  if (isActive) {
    statusText.textContent = 'online';
    statusDot.classList.add('online');
  } else {
    statusText.textContent = 'offline';
    statusDot.classList.remove('online');
  }
}

loadStatus();