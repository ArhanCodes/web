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
