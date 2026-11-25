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

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  const reduce = reduceMotion;
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

// Duetto page: a fake subtitle feed that types the original and fades in the translation.
const demo = document.querySelector('.captions-demo');
if (demo) {
  const orig = demo.querySelector('.captions-orig');
  const tr = demo.querySelector('.captions-tr');
  const lang = demo.querySelector('.captions-lang');
  const lines = [
    ['IT → EN', 'Buonasera a tutti e grazie di essere qui stasera.', 'Good evening everyone, and thank you for being here tonight.'],
    // Citazione da Aldo, Giovanni e Giacomo, «Tel chi el telùn» (1999).
    ['IT → EN', 'E adesso, un attimo di ripasso di inglese.', 'And now, a quick English refresher.'],
    ['IT → EN', 'Sui marciapiedi…', 'On the marciapaisis.'],
    ['IT → EN', 'Ma va là, va là, va là!', 'Oh, come on, be serious!'],
    ['EN → IT', "Let's start with a quick look at tonight's programme.", 'Iniziamo con uno sguardo veloce al programma della serata.'],
    ['IT → EN', 'Il prossimo intervento parla di audio in rete.', 'The next talk is about networked audio.'],
    ['ES → IT', 'Muchas gracias por la invitación, es un placer estar aquí.', "Grazie mille per l'invito, è un piacere essere qui."],
    ['IT → ES', 'Diamo il benvenuto al nostro primo relatore.', 'Demos la bienvenida a nuestro primer ponente.'],
  ];
  let i = 0, visible = false, timer = null;
  const wait = (ms) => new Promise((r) => { timer = setTimeout(r, ms); });

  async function play() {
    while (visible) {
      const [l, o, t] = lines[i % lines.length];
      lang.textContent = l;
      tr.classList.add('hidden');
      if (reduceMotion) {
        orig.textContent = o;
      } else {
        orig.innerHTML = '<span class="cursor"></span>';
        const cursor = orig.firstChild;
        for (const word of o.split(' ')) {
          if (!visible) return;
          cursor.before((cursor.previousSibling ? ' ' : '') + word);
          await wait(110 + Math.random() * 90);
        }
        cursor.remove();
      }
      await wait(reduceMotion ? 300 : 600);
      tr.textContent = t;
      tr.classList.remove('hidden');
      await wait(3600);
      i++;
    }
  }

  new IntersectionObserver(([e]) => {
    const was = visible;
    visible = e.isIntersecting;
    if (visible && !was) play();
    if (!visible) clearTimeout(timer);
  }, { threshold: 0.3 }).observe(demo);
}

// Contact form: sends through Web3Forms, so the inbox address never appears on the page.
const form = document.getElementById('contact-form');
if (form) {
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button[type="submit"]');
  const topic = new URLSearchParams(location.search).get('argomento');
  if (topic && form.argomento.querySelector(`option[value="${CSS.escape(topic)}"]`)) form.argomento.value = topic;

  const say = (msg, kind) => { status.textContent = msg; status.className = 'form-status ' + (kind || ''); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.botcheck.checked) return;

    let firstBad = null;
    for (const el of form.querySelectorAll('[required]')) {
      const bad = !el.value.trim() || (el.type === 'email' && !el.checkValidity());
      el.classList.toggle('invalid', bad);
      if (bad && !firstBad) firstBad = el;
    }
    if (firstBad) { say('Manca qualcosa: controlla i campi in rosso.', 'err'); firstBad.focus(); return; }

    if (form.access_key.value.startsWith('INCOLLA_QUI')) {
      say('Il modulo non è ancora attivo. Nel frattempo mi trovi su GitHub.', 'err');
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    const label = form.argomento.selectedOptions[0].textContent;
    data.subject = `Portfolio: ${label} (da ${data.name})`;
    delete data.botcheck;

    button.disabled = true;
    say('Invio in corso…');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.success === false) throw new Error(out.message || res.status);
      form.reset();
      say('Fatto! Il messaggio è arrivato, ti rispondo appena posso.', 'ok');
    } catch {
      say('Qualcosa è andato storto. Riprova tra poco, o scrivimi su GitHub.', 'err');
    } finally {
      button.disabled = false;
    }
  });

  form.addEventListener('input', (e) => e.target.classList.remove('invalid'));
}
