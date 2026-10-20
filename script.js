const slides = [...document.querySelectorAll('.slide')];
const selectors = [...document.querySelectorAll('.slide-buttons button')];
const pauseButton = document.querySelector('.pause');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let current = 0;
let paused = reducedMotion.matches;
let timer;
function showSlide(index) {
  current = index;
  slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
  selectors.forEach((button, i) => {
    button.classList.toggle('selected', i === index);
    button.setAttribute('aria-pressed', String(i === index));
  });
  document.querySelector('.slide-count').innerHTML = `0${index + 1} <i>/ 03</i>`;
}
function schedule() {
  clearInterval(timer);
  if (!paused && !document.hidden) timer = setInterval(() => showSlide((current + 1) % slides.length), 5000);
  pauseButton.textContent = paused ? '▶' : 'Ⅱ';
  pauseButton.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
}
selectors.forEach((button, index) => button.addEventListener('click', () => { showSlide(index); schedule(); }));
pauseButton.addEventListener('click', () => { paused = !paused; schedule(); });
document.addEventListener('visibilitychange', schedule);
reducedMotion.addEventListener('change', event => { paused = event.matches; schedule(); });
schedule();
const menu = document.querySelector('.menu');
const navigation = document.querySelector('#navigation');
function closeMenu() { navigation.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open navigation'); }
menu.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.querySelector('#year').textContent = new Date().getFullYear();
document.querySelector('#enquiry-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  if (button.disabled) return;
  const status = document.querySelector('#form-status');
  const data = Object.fromEntries(new FormData(form));
  data.consent = form.elements.consent.checked;
  button.disabled = true;
  button.textContent = 'Sending request…';
  form.setAttribute('aria-busy', 'true');
  status.textContent = '';
  try {
    const response = await fetch('/api/diesel-enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.timeout(45000) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to send your request. Please try again.');
    status.textContent = result.message;
    form.reset();
  } catch (error) {
    status.textContent = error.name === 'TimeoutError' || error instanceof TypeError ? 'We could not confirm delivery. Please check your connection and try again shortly.' : error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = 'Request diesel <span>↗</span>';
    form.removeAttribute('aria-busy');
  }
});
document.querySelector('#delivery-date').min = new Date(Date.now() + 3600000).toISOString().slice(0, 10);
