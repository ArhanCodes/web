// --- Activity signals (GitHub commits) ---
// “Currently coding” if you’ve pushed within the last X hours.
// This is privacy-respecting: it only uses your public GitHub activity.

const statusText = document.getElementById('statusText');
const statusDot = document.getElementById('statusDot');
const lastShipText = document.getElementById('lastShipText');
const year = document.getElementById('year');

if (year) year.textContent = String(new Date().getFullYear());

const GITHUB_USER = 'ArhanCodes';
const CODING_WINDOW_HOURS = 6;

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

function safeText(x) {
  return String(x || '').replace(/\s+/g, ' ').trim();
}

async function loadActivitySignals() {
  if (!statusText || !statusDot) return;

  // cheap cache to avoid rate-limit pain
  const cacheKey = 'gh_activity_cache_v1';
  const cacheMs = 5 * 60 * 1000; // 5 min

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached && Date.now() - cached.ts < cacheMs && cached.data) {
      applyActivitySignals(cached.data);
      return;
    }
  } catch {
    // ignore
  }

  try {
    // public events gives a good “recent push” signal.
    const url = `https://api.github.com/users/${encodeURIComponent(GITHUB_USER)}/events/public?per_page=30`;
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(`GitHub API error (${res.status})`);

    const events = await res.json();

    // Find most recent PushEvent
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
      // ignore
    }

    applyActivitySignals(data);
  } catch (err) {
    statusText.textContent = 'Activity signal unavailable (offline / rate limit).';
    if (lastShipText) lastShipText.textContent = '';
  }
}

function applyActivitySignals(data) {
  const pushAt = data?.pushCreatedAt ? new Date(data.pushCreatedAt) : null;

  if (pushAt && Date.now() - pushAt.getTime() <= msHours(CODING_WINDOW_HOURS)) {
    statusText.textContent = `Currently coding (pushed ${fmtAgo(pushAt)})`;
    statusDot.classList.add('good');
  } else if (pushAt) {
    statusText.textContent = `Not coding right now (last push ${fmtAgo(pushAt)})`;
    statusDot.classList.remove('good');
  } else {
    statusText.textContent = 'No recent push events found.';
    statusDot.classList.remove('good');
  }

  if (lastShipText) {
    if (pushAt) {
      const repo = safeText(data.pushRepo);
      const msg = safeText(data.pushCommitMsg);
      const left = repo ? `Last shipped: ${repo}` : 'Last shipped:';
      lastShipText.textContent = msg ? `${left} — “${msg}”` : left;
    } else {
      lastShipText.textContent = '';
    }
  }
}

loadActivitySignals();

// --- GitHub repo preview ---
const repoGrid = document.getElementById('repoGrid');
const repoHint = document.getElementById('repoHint');

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

async function loadRepos() {
  if (!repoGrid) return;

  try {
    const url = `https://api.github.com/users/${encodeURIComponent(GITHUB_USER)}/repos?sort=updated&per_page=6`;
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });

    if (!res.ok) throw new Error(`GitHub API error (${res.status})`);

    const repos = await res.json();
    const filtered = repos
      .filter((r) => !r.fork)
      .slice(0, 6);

    repoGrid.innerHTML = '';

    for (const r of filtered) {
      const right = el('span', { class: 'badge', text: r.language || 'Repo' });
      const top = el('div', { class: 'repo-top' }, [
        el('span', { class: 'repo-name', text: r.name }),
        right,
      ]);

      const meta = el('div', { class: 'repo-meta' }, [
        el('span', { class: 'badge', text: `★ ${r.stargazers_count}` }),
        el('span', { class: 'badge', text: `Updated ${fmtDate(r.updated_at)}` }),
      ]);

      const desc = el('div', { class: 'repo-desc', text: r.description || '—' });

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
      repoHint.textContent = 'Loaded from GitHub (public repos).';
    }
  } catch (err) {
    // Keep skeletons; show a small hint.
    if (repoHint) {
      repoHint.style.display = 'block';
      repoHint.textContent = 'Could not load GitHub repos (rate limit or offline).';
    }
  }
}

loadRepos();
