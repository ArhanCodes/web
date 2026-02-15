// If OpenClaw is running at build time, we mark you online.
// This is static hosting-friendly.
// If you later want a live status, we can swap this to ping an endpoint.
const OPENCLAW_RUNNING = true;

const statusText = document.getElementById('statusText');
const statusDot = document.getElementById('statusDot');
const year = document.getElementById('year');

if (year) year.textContent = String(new Date().getFullYear());

if (OPENCLAW_RUNNING) {
  statusText.textContent = "I'm currently online.";
  statusDot.classList.add('good');
} else {
  statusText.textContent = "I'm currently offline.";
}

// --- GitHub repo preview ---
const GITHUB_USER = 'ArhanCodes';
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
