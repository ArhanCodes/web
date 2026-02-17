function el(id) {
  return document.getElementById(id);
}

const $name = el('name');
const $subtitle = el('subtitle');
const $accent = el('accent');
const $description = el('description');

const $secProjects = el('sec_projects');
const $secGithub = el('sec_github');
const $secContact = el('sec_contact');

const $jsonOut = el('jsonOut');
const $htmlOut = el('htmlOut');

const $copyJson = el('copyJson');
const $downloadHtml = el('downloadHtml');
const $previewLink = el('previewLink');

function normalizeNewlines(x) {
  return String(x || '').replace(/\r\n/g, '\n');
}

function buildConfig() {
  return {
    name: normalizeNewlines($name.value).trim(),
    subtitle: normalizeNewlines($subtitle.value).trim(),
    accent: normalizeNewlines($accent.value).trim(),
    intro: normalizeNewlines($description.value).trim(),
    sections: {
      projects: !!$secProjects.checked,
      github: !!$secGithub.checked,
      contact: !!$secContact.checked,
    },
    links: {
      github: 'https://github.com/',
      linkedin: 'https://www.linkedin.com/',
    },
    generatedAt: new Date().toISOString(),
  };
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function buildHtml(cfg) {
  const css = `:root{--bg:#0b0f1a;--text:rgba(255,255,255,.92);--muted:rgba(255,255,255,.66);--card:rgba(255,255,255,.06);--border:rgba(255,255,255,.14);--accent:${cfg.accent || '#7c5cff'};}
*{box-sizing:border-box}html,body{height:100%}body{margin:0;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:radial-gradient(900px 520px at 25% 15%, color-mix(in srgb, var(--accent) 30%, transparent), transparent 55%),radial-gradient(900px 520px at 85% 25%, rgba(45,212,191,.18), transparent 55%),var(--bg);color:var(--text)}
.wrap{width:min(760px,calc(100% - 44px));margin:0 auto;padding:42px 0 30px}
.header{display:flex;gap:18px;justify-content:space-between;align-items:flex-start;margin-bottom:18px}
.links{display:flex;gap:12px;flex-wrap:wrap}
.link{border:1px solid var(--border);background:rgba(255,255,255,.03);padding:8px 10px;border-radius:999px;text-decoration:none;color:var(--text);font-weight:700;font-size:13px}
.link:hover{background:rgba(255,255,255,.06)}
.card{border:1px solid var(--border);background:var(--card);border-radius:18px;padding:16px;margin:14px 0}
.subtitle{margin:6px 0 0;color:var(--muted);font-weight:600}
.muted{color:var(--muted)}
.tile{border:1px solid var(--border);background:rgba(255,255,255,.03);border-radius:16px;padding:12px;text-decoration:none;display:block;color:var(--text)}
.tile:hover{background:rgba(255,255,255,.06)}
.tile-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.badge{border:1px solid var(--border);background:rgba(255,255,255,.02);padding:4px 8px;border-radius:999px;color:var(--muted);font-weight:700;font-size:12px}
@media (max-width:560px){.header{flex-direction:column}}`;

  const projectsSection = cfg.sections.projects
    ? `\n      <section class="card">\n        <h2 style="margin:0 0 10px;font-size:16px">Projects</h2>\n        <a class="tile" href="#">\n          <div class="tile-top">\n            <span style="font-weight:900">Project name</span>\n            <span class="badge">Demo</span>\n          </div>\n          <div class="muted" style="margin-top:8px;line-height:1.5">One-line description.</div>\n        </a>\n      </section>`
    : '';

  const githubSection = cfg.sections.github
    ? `\n      <section class="card">\n        <h2 style="margin:0 0 10px;font-size:16px">GitHub</h2>\n        <p class="muted" style="margin:0">Add a repo preview here if you want.</p>\n      </section>`
    : '';

  const contactSection = cfg.sections.contact
    ? `\n      <section class="card">\n        <h2 style="margin:0 0 10px;font-size:16px">Contact</h2>\n        <div class="links">\n          <a class="link" href="mailto:you@example.com">Email</a>\n          <a class="link" href="${escapeHtml(cfg.links.github)}" target="_blank" rel="noreferrer">GitHub</a>\n          <a class="link" href="${escapeHtml(cfg.links.linkedin)}" target="_blank" rel="noreferrer">LinkedIn</a>\n        </div>\n      </section>`
    : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(cfg.name)} • Portfolio</title>
    <meta name="description" content="${escapeHtml(cfg.subtitle)}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <style>${css}</style>
  </head>
  <body>
    <main class="wrap">
      <header class="header">
        <div>
          <h1 style="margin:0;font-size:30px;letter-spacing:-.5px">${escapeHtml(cfg.name)}</h1>
          <p class="subtitle">${escapeHtml(cfg.subtitle)}</p>
        </div>
        <div class="links">
          <a class="link" href="${escapeHtml(cfg.links.github)}" target="_blank" rel="noreferrer">GitHub</a>
          <a class="link" href="${escapeHtml(cfg.links.linkedin)}" target="_blank" rel="noreferrer">LinkedIn</a>
        </div>
      </header>

      <section class="card">
        <p style="margin:0;line-height:1.6">${escapeHtml(cfg.intro)}</p>
      </section>
      ${projectsSection}
      ${githubSection}
      ${contactSection}

      <footer style="margin-top:18px" class="muted">Generated: ${escapeHtml(cfg.generatedAt)}</footer>
    </main>
  </body>
</html>`;
}

function prettyJson(obj) {
  return JSON.stringify(obj, null, 2);
}

/** Track the previous blob URL so we can revoke it and avoid memory leaks */
let _prevBlobUrl = null;

function refresh() {
  const cfg = buildConfig();
  const html = buildHtml(cfg);

  $jsonOut.textContent = prettyJson(cfg);
  $htmlOut.textContent = html;

  // Revoke previous blob URL to prevent memory leak
  if (_prevBlobUrl) {
    URL.revokeObjectURL(_prevBlobUrl);
  }

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  _prevBlobUrl = url;

  $previewLink.href = url;
  $previewLink.target = '_blank';
  $previewLink.rel = 'noreferrer';
  $previewLink.textContent = 'Open preview';

  // keep latest for buttons
  window.__generated = { cfg, html };
}

async function copyJson() {
  const txt = prettyJson(window.__generated?.cfg || buildConfig());
  try {
    await navigator.clipboard.writeText(txt);
    $copyJson.textContent = 'Copied!';
    setTimeout(() => ($copyJson.textContent = 'Copy JSON'), 900);
  } catch {
    alert('Copy failed — your browser blocked clipboard.');
  }
}

function downloadHtml() {
  const html = window.__generated?.html || buildHtml(buildConfig());
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  const dlUrl = URL.createObjectURL(blob);
  a.href = dlUrl;
  a.download = 'index.html';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Clean up download blob URL after a short delay
  setTimeout(() => URL.revokeObjectURL(dlUrl), 1000);
}

[$name, $subtitle, $accent, $description, $secProjects, $secGithub, $secContact].forEach((x) =>
  x.addEventListener('input', refresh)
);

$copyJson.addEventListener('click', copyJson);
$downloadHtml.addEventListener('click', downloadHtml);

refresh();
