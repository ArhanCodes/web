const $accent = document.getElementById('accent');
const $accentHex = document.getElementById('accentHex');
const $card = document.getElementById('card');
const $border = document.getElementById('border');
const $bg = document.getElementById('bg');
const $bgHex = document.getElementById('bgHex');

const $cssOut = document.getElementById('cssOut');
const $copyCss = document.getElementById('copyCss');
const $reset = document.getElementById('reset');

const DEFAULTS = {
  accent: '#7c5cff',
  bg: '#0b0f1a',
  cardA: 0.06,
  borderA: 0.14,
};

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function rgbaWhite(a) {
  return `rgba(255,255,255,${clamp01(a).toFixed(2)})`;
}

function normalizeHex(x, fallback) {
  const s = String(x || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
  return fallback;
}

function buildRootCss() {
  const accent = normalizeHex($accentHex.value, $accent.value);
  const bg = normalizeHex($bgHex.value, $bg.value);
  const cardA = Number($card.value);
  const borderA = Number($border.value);

  return `:root {\n` +
    `  --bg: ${bg};\n` +
    `  --text: rgba(255,255,255,0.92);\n` +
    `  --muted: rgba(255,255,255,0.66);\n` +
    `  --card: ${rgbaWhite(cardA)};\n` +
    `  --border: ${rgbaWhite(borderA)};\n` +
    `  --accent: ${accent};\n` +
    `  --good: #22c55e;\n` +
    `  --bad: #f97316;\n` +
    `}`;
}

function applyToPage() {
  const accent = normalizeHex($accentHex.value, $accent.value);
  const bg = normalizeHex($bgHex.value, $bg.value);
  const cardA = Number($card.value);
  const borderA = Number($border.value);

  document.documentElement.style.setProperty('--accent', accent);
  document.documentElement.style.setProperty('--bg', bg);
  document.documentElement.style.setProperty('--card', rgbaWhite(cardA));
  document.documentElement.style.setProperty('--border', rgbaWhite(borderA));

  $cssOut.textContent = buildRootCss();
}

async function copyCss() {
  const txt = buildRootCss();
  try {
    await navigator.clipboard.writeText(txt);
    $copyCss.textContent = 'Copied!';
    setTimeout(() => ($copyCss.textContent = 'Copy :root CSS'), 900);
  } catch {
    alert('Copy failed — your browser blocked clipboard.');
  }
}

function reset() {
  $accent.value = DEFAULTS.accent;
  $accentHex.value = DEFAULTS.accent;
  $bg.value = DEFAULTS.bg;
  $bgHex.value = DEFAULTS.bg;
  $card.value = String(DEFAULTS.cardA);
  $border.value = String(DEFAULTS.borderA);
  applyToPage();
}

// keep hex + color inputs in sync
$accent.addEventListener('input', () => {
  $accentHex.value = $accent.value;
  applyToPage();
});
$accentHex.addEventListener('input', () => {
  $accent.value = normalizeHex($accentHex.value, DEFAULTS.accent);
  applyToPage();
});

$bg.addEventListener('input', () => {
  $bgHex.value = $bg.value;
  applyToPage();
});
$bgHex.addEventListener('input', () => {
  $bg.value = normalizeHex($bgHex.value, DEFAULTS.bg);
  applyToPage();
});

[$card, $border].forEach((x) => x.addEventListener('input', applyToPage));

$copyCss.addEventListener('click', copyCss);
$reset.addEventListener('click', reset);

reset();
