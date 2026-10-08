// Nota de los alumnos UniCPO + reportes de soporte.
// Habla con el Apps Script de backend/Code.gs (config.js → apiUrl).
// Sin apiUrl la sección se oculta; con ?demo en la URL funciona en modo prueba (solo en este navegador).
(function () {
  'use strict';

  const cfg = window.MAP_CONFIG || {};
  const API = (cfg.apiUrl || '').trim();
  const DEMO = !API && /[?&]demo\b/.test(location.search);
  const ENABLED = !!API || DEMO;
  const VOTABLE = ['restaurante', 'bar', 'cafe', 'hotel', 'airbnb', 'mercado', 'gimnasio', 'parque', 'shopping'];
  const COMM = {
    facil: { ico: '😊', label: 'Fácil' },
    esfuerzo: { ico: '😐', label: 'Con esfuerzo' },
    dificil: { ico: '😕', label: 'Difícil' },
  };
  const REPORT_TYPES = {
    direccion: { ico: '📍', label: 'Dirección o ubicación incorrecta' },
    horario: { ico: '🕒', label: 'Horario incorrecto' },
    cerrado: { ico: '🚫', label: 'El lugar cerró' },
    otro: { ico: '✏️', label: 'Otro problema' },
  };

  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const fmt = n => String(n).replace('.', ',');
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* modo privado */ } },
  };

  function deviceId() {
    let id = store.get('mapa-device', '');
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)).toLowerCase();
      store.set('mapa-device', id);
    }
    return id;
  }

  // ---------- API (real o demo) ----------
  let stats = {};
  const listeners = [];

  async function loadStats() {
    if (!ENABLED) return;
    try {
      if (DEMO) stats = demoStats();
      else stats = await (await fetch(API + '?action=stats', { cache: 'no-store' })).json();
    } catch (e) { stats = {}; }
    listeners.forEach(fn => fn());
  }

  async function post(payload) {
    const body = Object.assign({ device: deviceId() }, payload);
    if (DEMO) return demoPost(body);
    const res = await fetch(API, { method: 'POST', body: JSON.stringify(body) }); // text/plain: sin preflight CORS
    return res.json();
  }

  function demoStats() {
    const votes = store.get('demo-votes', {});
    const out = {};
    Object.values(votes).forEach(v => {
      const s = out[v.placeId] || (out[v.placeId] = { n: 0, sum: 0, comm: { facil: 0, esfuerzo: 0, dificil: 0 } });
      s.n++; s.sum += v.stars; s.comm[v.comm]++;
    });
    Object.values(out).forEach(s => { s.avg = Math.round(s.sum / s.n * 10) / 10; delete s.sum; });
    return out;
  }
  function demoPost(b) {
    if (b.action === 'vote') {
      const votes = store.get('demo-votes', {});
      votes[b.placeId] = { placeId: b.placeId, stars: b.stars, comm: b.comm };
      store.set('demo-votes', votes);
      stats = demoStats();
      return { ok: true, stats: stats[b.placeId] };
    }
    const reps = store.get('demo-reports', []);
    reps.push(b); store.set('demo-reports', reps);
    console.info('[demo] reporte guardado localmente', b);
    return { ok: true };
  }

  // ---------- notas ----------
  function ratingsHTML(p) {
    const s = stats[p.id];
    const google = p.rating
      ? `<div class="rate rate--google">
           <span class="rate__who"><span class="g-logo">G</span> Google</span>
           <span class="rate__num">${esc(p.rating)}<small>★</small></span>
           <span class="rate__sub">${p.reviews ? p.reviews.toLocaleString('es') + ' opiniones' : 'opiniones'} · público general</span>
         </div>`
      : '';
    if (!ENABLED || !VOTABLE.includes(p.cat)) return google ? `<div class="rates">${google}</div>` : '';

    let uni;
    if (s && s.n) {
      const total = s.comm.facil + s.comm.esfuerzo + s.comm.dificil;
      const pct = total ? Math.round(s.comm.facil / total * 100) : 0;
      uni = `<div class="rate rate--uni">
          <span class="rate__who">🎓 Alumnos UniCPO</span>
          <span class="rate__num">${fmt(s.avg.toFixed(1))}<small>★</small></span>
          <span class="rate__sub">${s.n} ${s.n === 1 ? 'voto' : 'votos'} · hispanohablantes</span>
          ${total ? `<span class="rate__comm">💬 ${pct}% se comunicó fácil</span>` : ''}
        </div>`;
    } else {
      uni = `<div class="rate rate--uni rate--empty">
          <span class="rate__who">🎓 Alumnos UniCPO</span>
          <span class="rate__num">—</span>
          <span class="rate__sub">Aún sin votos. ¡Sé el primero!</span>
        </div>`;
    }
    return `<div class="rates">${uni}${google}</div>
      <p class="rates__note">La <b>nota UniCPO</b> la dan nuestros alumnos extranjeros: muestra cómo atienden a quien habla español. La de Google es del público general.</p>`;
  }

  function voteHTML(p) {
    if (!ENABLED || !VOTABLE.includes(p.cat)) return '';
    const mine = store.get('mapa-my-votes', {})[p.id];
    return `<div class="vote" data-vote>
      <button class="btn btn--rate btn--full" data-vote-open>${mine ? `Tu nota: ${'★'.repeat(mine.stars)} · Cambiar` : '⭐ Calificar este lugar'}</button>
      <form class="vote__form" data-vote-form hidden>
        <p class="vote__q">¿Qué nota le das?</p>
        <div class="stars" role="radiogroup" aria-label="Estrellas">
          ${[1, 2, 3, 4, 5].map(n => `<button type="button" class="star" data-star="${n}" role="radio" aria-checked="false" aria-label="${n} estrellas">★</button>`).join('')}
        </div>
        <p class="vote__q">¿Te entendieron hablando español?</p>
        <div class="opts">
          ${Object.entries(COMM).map(([k, v]) => `<label class="opt"><input type="radio" name="comm" value="${k}"><span>${v.ico} ${v.label}</span></label>`).join('')}
        </div>
        <label class="check"><input type="checkbox" name="alumno"><span>Soy alumno(a) o exalumno(a) de UniCPO</span></label>
        <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
        <p class="form-msg" data-msg></p>
        <div class="p-actions"><button type="button" class="btn btn--ghost" data-vote-cancel>Cancelar</button><button type="submit" class="btn btn--primary" data-vote-send disabled>Enviar mi nota</button></div>
      </form>
    </div>`;
  }

  function reportHTML(p) {
    if (!ENABLED || p.cat === 'unicpo') return '';
    return `<div class="report" data-report>
      <button class="report__link" data-report-open>⚠️ ¿Algo está mal en este lugar? Avísanos</button>
      <div class="report__box" data-step="1" hidden>
        <p class="report__title">Paso 1 de 2 · ¿Qué está mal?</p>
        <div class="opts opts--col">
          ${Object.entries(REPORT_TYPES).map(([k, v]) => `<label class="opt"><input type="radio" name="tipo" value="${k}"><span>${v.ico} ${v.label}</span></label>`).join('')}
        </div>
        <textarea name="detalle" maxlength="300" rows="2" placeholder="Cuéntanos qué viste (ej.: ahora abre a las 18:00)"></textarea>
        <p class="form-msg" data-msg></p>
        <div class="p-actions"><button type="button" class="btn btn--ghost" data-report-cancel>Cancelar</button><button type="button" class="btn btn--primary" data-report-next disabled>Continuar</button></div>
      </div>
      <div class="report__box report__box--confirm" data-step="2" hidden>
        <p class="report__title">Paso 2 de 2 · Confirma tu reporte</p>
        <div class="report__summary" data-summary></div>
        <label class="check"><input type="checkbox" name="verificado"><span>Lo verifiqué personalmente: fui al lugar, llamé o lo vi en su página oficial.</span></label>
        <p class="report__fine">Los reportes no se publican. El equipo de UniCPO revisa cada uno antes de cambiar el mapa.</p>
        <p class="form-msg" data-msg></p>
        <div class="p-actions"><button type="button" class="btn btn--ghost" data-report-back>Volver</button><button type="button" class="btn btn--danger" data-report-send disabled>Sí, enviar reporte</button></div>
      </div>
      <p class="report__done" data-step="done" hidden>✅ ¡Gracias! Recibimos tu reporte y lo vamos a revisar.</p>
    </div>`;
  }

  // ---------- comportamiento ----------
  function mount(root, p, rerender) {
    if (!ENABLED) return;
    const msg = (scope, t, ok) => { const m = scope.querySelector('[data-msg]'); if (m) { m.textContent = t || ''; m.classList.toggle('is-ok', !!ok); } };

    // Votar
    const vote = root.querySelector('[data-vote]');
    if (vote) {
      const form = vote.querySelector('[data-vote-form]');
      const send = vote.querySelector('[data-vote-send]');
      let stars = 0;
      const mine = store.get('mapa-my-votes', {})[p.id];
      const paint = () => vote.querySelectorAll('.star').forEach(b => { const on = +b.dataset.star <= stars; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', String(+b.dataset.star === stars)); });
      const check = () => { send.disabled = !(stars && form.comm.value && form.alumno.checked); };
      if (mine) { stars = mine.stars; paint(); const r = form.querySelector(`input[name=comm][value="${mine.comm}"]`); if (r) r.checked = true; form.alumno.checked = true; }
      vote.querySelector('[data-vote-open]').addEventListener('click', e => { e.currentTarget.hidden = true; form.hidden = false; check(); });
      vote.querySelector('[data-vote-cancel]').addEventListener('click', () => { form.hidden = true; vote.querySelector('[data-vote-open]').hidden = false; msg(form, ''); });
      vote.querySelectorAll('.star').forEach(b => b.addEventListener('click', () => { stars = +b.dataset.star; paint(); check(); }));
      form.addEventListener('change', check);
      form.addEventListener('submit', async e => {
        e.preventDefault();
        send.disabled = true; msg(form, 'Enviando…');
        try {
          const r = await post({ action: 'vote', placeId: p.id, placeName: p.name, stars, comm: form.comm.value, website: form.website.value });
          if (!r.ok) throw new Error(r.error || 'Error');
          const my = store.get('mapa-my-votes', {}); my[p.id] = { stars, comm: form.comm.value }; store.set('mapa-my-votes', my);
          if (r.stats) stats[p.id] = r.stats;
          rerender();
        } catch (err) { msg(form, err.message === 'Failed to fetch' ? 'Sin conexión. Intenta de nuevo.' : err.message); send.disabled = false; }
      });
    }

    // Reportar (dos pasos)
    const rep = root.querySelector('[data-report]');
    if (rep) {
      const step = n => rep.querySelectorAll('[data-step]').forEach(el => { el.hidden = el.dataset.step !== String(n); });
      const s1 = rep.querySelector('[data-step="1"]');
      const s2 = rep.querySelector('[data-step="2"]');
      const next = rep.querySelector('[data-report-next]');
      const sendR = rep.querySelector('[data-report-send]');
      const tipo = () => (s1.querySelector('input[name=tipo]:checked') || {}).value;
      const det = () => s1.querySelector('textarea').value.trim();
      const v1 = () => { next.disabled = !tipo() || (tipo() === 'otro' && det().length < 5); };
      rep.querySelector('[data-report-open]').addEventListener('click', e => { e.currentTarget.hidden = true; step(1); });
      rep.querySelector('[data-report-cancel]').addEventListener('click', () => { step('none'); rep.querySelector('[data-report-open]').hidden = false; });
      s1.addEventListener('input', v1); s1.addEventListener('change', v1);
      next.addEventListener('click', () => {
        const t = REPORT_TYPES[tipo()];
        rep.querySelector('[data-summary]').innerHTML = `<b>${esc(p.name)}</b><span>${t.ico} ${t.label}</span>${det() ? `<em>"${esc(det())}"</em>` : ''}`;
        s2.querySelector('input[name=verificado]').checked = false; sendR.disabled = true; msg(s2, '');
        step(2);
      });
      rep.querySelector('[data-report-back]').addEventListener('click', () => step(1));
      s2.querySelector('input[name=verificado]').addEventListener('change', e => { sendR.disabled = !e.target.checked; });
      sendR.addEventListener('click', async () => {
        sendR.disabled = true; msg(s2, 'Enviando…');
        try {
          const r = await post({ action: 'report', placeId: p.id, placeName: p.name, tipo: tipo(), detalle: det(), confirmed: true });
          if (!r.ok) throw new Error(r.error || 'Error');
          step('done');
        } catch (err) { msg(s2, err.message === 'Failed to fetch' ? 'Sin conexión. Intenta de nuevo.' : err.message); sendR.disabled = false; }
      });
    }
  }

  window.Community = {
    enabled: ENABLED,
    demo: DEMO,
    load: loadStats,
    onChange: fn => listeners.push(fn),
    statsFor: id => stats[id],
    ratingsHTML, voteHTML, reportHTML, mount,
  };
})();
