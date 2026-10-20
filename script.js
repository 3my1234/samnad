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
  if (!paused && !document.hidden) timer = setInterval(() => showSlide((current + 1) % slides.length), 7000);
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
document.querySelector('#enquiry-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const content = `SAMNAD MOONLIGHT — ENQUIRY\n\nName: ${data.get('name')}\nEmail: ${data.get('email')}\nSubject: ${data.get('interest')}\n\n${data.get('message')}\n\nThis enquiry has been prepared locally and has not been sent.\n`;
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = 'samnad-moonlight-enquiry.txt'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.querySelector('#form-status').textContent = 'Your enquiry file is ready. It has not been sent — online delivery is not yet connected.';
});
