// Fade-in sections as they scroll into view.
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('in'));
}

document.getElementById('year').textContent = new Date().getFullYear();

// Rustbucket: a small animated Control|24-style console.
const strips = document.querySelector('.console-strips');
if (strips) {
  const names = ['KICK', 'SNR', 'OH L', 'OH R', 'BASS', 'GTR', 'KEYS', 'VOX', 'BV 1', 'BV 2', 'FX', 'MSTR'];
  const state = names.map((name, i) => {
    const el = document.createElement('div');
    el.className = 'strip';
    el.innerHTML = `
      <div class="scribble">${name}</div>
      <div class="vpot"></div>
      <div class="fader-row">
        <div class="meter"></div><div class="track"><div class="cap"></div></div><div class="meter"></div>
      </div>
      <div class="mute${i === 5 ? ' on' : ''}"></div>`;
    strips.appendChild(el);
    return {
      el,
      meters: el.querySelectorAll('.meter'),
      cap: el.querySelector('.cap'),
      vpot: el.querySelector('.vpot'),
      base: 35 + Math.random() * 35,
    };
  });

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const setFaders = () => state.forEach((s) => {
    s.cap.style.setProperty('--pos', `${Math.round(30 + Math.random() * 55)}%`);
    s.vpot.style.setProperty('--rot', `${Math.round(-130 + Math.random() * 260)}deg`);
  });
  setFaders();

  if (!reduce) {
    let visible = false;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(strips);
    setInterval(() => {
      if (!visible) return;
      state.forEach((s) => s.meters.forEach((m) => {
        const lvl = Math.max(4, Math.min(98, s.base + (Math.random() - 0.5) * 50));
        m.style.setProperty('--lvl', `${lvl}%`);
      }));
    }, 110);
    setInterval(() => { if (visible) setFaders(); }, 3200);
  }
}
