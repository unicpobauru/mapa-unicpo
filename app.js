(function () {
  'use strict';

  const CATS = {
    hotel:       { label: 'Hoteles',            ico: '🏨', c: '#2563eb' },
    airbnb:      { label: 'Airbnb · Tânia',     ico: '🏡', c: '#ff385c' },
    farmacia:    { label: 'Farmacias',          ico: '💊', c: '#e5484d' },
    restaurante: { label: 'Restaurantes',       ico: '🍽️', c: '#f59e0b' },
    bar:         { label: 'Bares',              ico: '🍺', c: '#8b5cf6' },
    mercado:     { label: 'Supermercados',      ico: '🛒', c: '#0ea5b7' },
    cafe:        { label: 'Cafés y panaderías', ico: '☕', c: '#a0632b' },
    parque:      { label: 'Parques',            ico: '🌳', c: '#16a34a' },
    salud:       { label: 'Salud y urgencias',  ico: '🏥', c: '#0f766e' },
    cambio:      { label: 'Casas de cambio',    ico: '💱', c: '#65a30d' },
    shopping:    { label: 'Shoppings',          ico: '🛍️', c: '#db2777' },
    gimnasio:    { label: 'Gimnasios',          ico: '💪', c: '#475569' },
    transporte:  { label: 'Rodoviária',         ico: '🚌', c: '#334155' },
  };
  const ORDER = Object.keys(CATS);
  const PLACES = window.PLACES || [];
  const HOME = PLACES.find(p => p.id === 'unicpo-sede');
  const PHOTO_DIR = 'img/hospedaje/';
  const WA_MSG = n => `¡Hola! Soy estudiante de UniCPO y vi "${n}" en el mapa del Manual de Supervivencia. ¿Tiene disponibilidad?`;

  const active = new Set(ORDER);
  const markers = new Map(); // id -> { place, el, handle }
  let map = null;
  let current = null;

  // ---------- helpers ----------
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  function meters(a, b) {
    const R = 6371000, r = Math.PI / 180;
    const dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r;
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function distLabel(p) {
    const d = meters(HOME, p);
    if (d < 2200) {
      const min = Math.max(1, Math.round(d * 1.25 / 75));
      return { short: `${min} min`, long: `🚶 ${min} min a pie · ${d < 1000 ? Math.round(d / 10) * 10 + ' m' : (d / 1000).toFixed(1).replace('.', ',') + ' km'}`, walk: true, d };
    }
    const min = Math.max(3, Math.round(d * 1.35 / 420));
    return { short: `${(d / 1000).toFixed(1).replace('.', ',')} km`, long: `🚗 ~${min} min en auto/Uber · ${(d / 1000).toFixed(1).replace('.', ',')} km`, walk: false, d };
  }
  const isRich = p => p.photos && p.photos.length;
  const gmapsSearch = p => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ', Bauru - SP')}`;
  const gmapsDir = (p, walk) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}&travelmode=${walk ? 'walking' : 'driving'}`;

  // ---------- marker DOM ----------
  function markerEl(p) {
    const el = document.createElement('div');
    el.className = 'mk';
    if (p.cat === 'unicpo') {
      const main = p.id === 'unicpo-sede';
      el.innerHTML = `<div class="mk-unicpo ${main ? '' : 'is-secondary'}"><div class="mk-unicpo__pin"><span>U</span></div><div class="mk-unicpo__label">${main ? 'UniCPO' : 'UniCPO · H. Pinto'}</div></div>`;
      return el;
    }
    const cat = CATS[p.cat];
    el.style.setProperty('--c', cat.c);
    if (isRich(p)) {
      const short = p.name.replace(/^Tânia Alves · /, '').replace(/ · Tânia Alves$/, '').replace(/^Depto\. /, '').replace(/^Hotel /, '');
      el.innerHTML = `<div class="mk-photo"><div class="mk-photo__ring"></div><div class="mk-photo__img" style="background-image:url('${PHOTO_DIR + p.photos[0]}')"></div><div class="mk-photo__tag">${esc(short.length > 22 ? short.slice(0, 21) + '…' : short)}</div></div>`;
    } else {
      el.innerHTML = `<div class="mk-dot ${p.psd ? 'is-psd' : ''}">${cat.ico}</div>`;
    }
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', p.name);
    return el;
  }

  // ---------- providers ----------
  function leafletProvider() {
    const m = L.map('map', { zoomControl: false, attributionControl: true }).setView([HOME.lat, HOME.lon], 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    m.on('click', () => closeSheet());
    m.on('zoomend', () => zoomClass(m.getZoom()));
    return {
      add(p, el, z, onClick) {
        const mk = L.marker([p.lat, p.lon], { icon: L.divIcon({ className: 'lf-wrap', html: el, iconSize: [0, 0] }), zIndexOffset: z, keyboard: false });
        if (onClick) mk.on('click', e => { L.DomEvent.stopPropagation(e); onClick(); });
        mk.addTo(m);
        return { show: v => (v ? mk.addTo(m) : mk.remove()) };
      },
      circle(r, label) {
        L.circle([HOME.lat, HOME.lon], { radius: r, color: '#0b2a4a', weight: 1.5, opacity: .45, dashArray: '6 6', fillColor: '#0b2a4a', fillOpacity: r < 500 ? .05 : .025, interactive: false }).addTo(m);
        const lab = document.createElement('div'); lab.className = 'ring-label'; lab.textContent = label;
        L.marker([HOME.lat + r / 111000, HOME.lon], { icon: L.divIcon({ className: 'lf-wrap', html: lab, iconSize: [0, 0] }), interactive: false, zIndexOffset: -1000 }).addTo(m);
      },
      fly(p, z, dy = 0) {
        const zoom = Math.max(z || 16, m.getZoom());
        const pt = m.project([p.lat, p.lon], zoom).add([0, dy]);
        // flyTo falla (NaN) si el mapa aún no tiene tamaño, p. ej. pestaña en segundo plano
        if (m.getSize().x && m.getSize().y) m.flyTo(m.unproject(pt, zoom), zoom, { duration: .6 });
        else m.setView(m.unproject(pt, zoom), zoom, { animate: false });
      },
      zoom: () => m.getZoom(),
    };
  }

  function googleProvider() {
    const gm = google.maps;
    const m = new gm.Map(document.getElementById('map'), {
      center: { lat: HOME.lat, lng: HOME.lon }, zoom: 15, disableDefaultUI: true, gestureHandling: 'greedy', clickableIcons: false,
      styles: [
        { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    });
    class Html extends gm.OverlayView {
      constructor(pos, el, z) { super(); this.pos = new gm.LatLng(pos.lat, pos.lon); this.el = el; this.el.style.zIndex = 1000 + z; }
      onAdd() { gm.OverlayView.preventMapHitsAndGesturesFrom(this.el); this.getPanes().overlayMouseTarget.appendChild(this.el); }
      draw() { const pt = this.getProjection().fromLatLngToDivPixel(this.pos); this.el.style.left = pt.x + 'px'; this.el.style.top = pt.y + 'px'; }
      onRemove() { this.el.remove(); }
    }
    m.addListener('click', () => closeSheet());
    m.addListener('zoom_changed', () => zoomClass(m.getZoom()));
    return {
      add(p, el, z, onClick) {
        if (onClick) el.addEventListener('click', e => { e.stopPropagation(); onClick(); });
        const o = new Html(p, el, z); o.setMap(m);
        return { show: v => o.setMap(v ? m : null) };
      },
      circle(r, label) {
        new gm.Circle({ map: m, center: { lat: HOME.lat, lng: HOME.lon }, radius: r, strokeColor: '#0b2a4a', strokeOpacity: .45, strokeWeight: 1.5, fillColor: '#0b2a4a', fillOpacity: r < 500 ? .05 : .025, clickable: false });
        const lab = document.createElement('div'); lab.className = 'ring-label'; lab.textContent = label;
        new Html({ lat: HOME.lat + r / 111000, lon: HOME.lon }, lab, -900).setMap(m);
      },
      fly(p, z, dy = 0) {
        if (m.getZoom() < (z || 16)) m.setZoom(z || 16);
        m.panTo({ lat: p.lat, lng: p.lon });
        if (dy) m.panBy(0, dy);
      },
      zoom: () => m.getZoom(),
    };
  }

  function zoomClass(z) { document.getElementById('map').classList.toggle('zoom-low', z < 16); }

  // ---------- chips ----------
  function counts() {
    const c = {};
    PLACES.forEach(p => { c[p.cat] = (c[p.cat] || 0) + 1; });
    return c;
  }
  function renderChips() {
    const n = counts();
    const nav = $('#chips');
    const all = active.size === ORDER.length;
    nav.innerHTML = `<button class="chip chip--all" data-all aria-pressed="${all}">${all ? 'Quitar todos' : 'Ver todos'}</button>` +
      ORDER.filter(k => n[k]).map(k => `<button class="chip" data-cat="${k}" aria-pressed="${active.has(k)}" style="--c:${CATS[k].c}"><span class="chip__ico">${CATS[k].ico}</span>${CATS[k].label}<span class="chip__n">${n[k]}</span></button>`).join('');
  }
  $('#chips').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-all')) {
      if (active.size === ORDER.length) active.clear(); else ORDER.forEach(k => active.add(k));
    } else {
      const k = b.dataset.cat;
      active.has(k) ? active.delete(k) : active.add(k);
    }
    applyFilters(); renderChips();
    if (!$('#list').hidden) renderList();
  });
  function applyFilters() {
    markers.forEach(({ place, handle }) => {
      if (place.cat === 'unicpo') return;
      handle.show(active.has(place.cat));
    });
    if (current && !active.has(current.cat) && current.cat !== 'unicpo') closeSheet();
  }

  // ---------- sheet ----------
  function openPlace(p, fly) {
    closeList();
    current = p;
    markers.forEach(m => m.el.classList.toggle('is-active', m.place === p));
    const cat = CATS[p.cat] || { label: 'UniCPO', ico: '🎓', c: '#0b2a4a' };
    const dl = p.cat === 'unicpo' ? null : distLabel(p);
    const L = p.links || {};
    const photos = (p.photos || []).map(f => `<img src="${PHOTO_DIR + f}" alt="${esc(p.name)}" loading="lazy">`).join('');
    const tags = [
      dl ? `<span class="tag">${dl.long}</span>` : '',
      p.rating ? `<span class="tag">⭐ ${esc(p.rating)}${p.reviews ? ` <span style="opacity:.6">(${p.reviews.toLocaleString('es')})</span>` : ''}</span>` : '',
      p.partner ? `<span class="tag tag--partner">♥ Socia UniCPO</span>` : '',
      p.guia ? `<span class="tag">📘 Guía UniCPO</span>` : '',
      p.psd ? `<span class="tag tag--psd">🎬 Del episodio</span>` : '',
      p.aprox ? `<span class="tag tag--warn">📍 Ubicación aproximada</span>` : '',
    ].join('');
    const actions = [];
    if (L.whatsapp) actions.push(`<a class="btn btn--wa" target="_blank" rel="noopener" href="${L.whatsapp}?text=${encodeURIComponent(WA_MSG(p.name))}">WhatsApp</a>`);
    if (L.site) actions.push(`<a class="btn btn--primary" target="_blank" rel="noopener" href="${esc(L.site)}">${/booking|airbnb|omnibees/.test(L.site) ? 'Reservar' : 'Ver fotos / info'}</a>`);
    if (p.tel && !L.whatsapp) actions.push(`<a class="btn btn--ghost" href="tel:${p.tel.replace(/\D/g, '')}">Llamar</a>`);
    if (p.cat !== 'unicpo' && !p.aprox) actions.push(`<a class="btn btn--ghost" target="_blank" rel="noopener" href="${gmapsDir(p, dl && dl.walk)}">Cómo llegar</a>`);
    actions.push(`<a class="btn btn--ghost" target="_blank" rel="noopener" href="${gmapsSearch(p)}">Ver en Google Maps</a>`);
    if (actions.length % 2) actions[actions.length - 1] = actions[actions.length - 1].replace('class="btn ', 'class="btn btn--full ');

    $('#sheet-body').innerHTML = `
      ${photos ? `<div class="gal ${p.photos.length > 1 ? 'gal--multi' : ''}">${photos}</div>` : ''}
      <span class="p-cat" style="--c:${cat.c}">${cat.ico} ${cat.label}${p.far ? ' · más alejado' : ''}</span>
      <h2 class="p-name">${esc(p.name)}</h2>
      <div class="p-meta">${tags}</div>
      ${p.info ? `<p class="p-info">${esc(p.info)}</p>` : ''}
      ${p.addr ? `<p class="p-row"><b>Dirección:</b> ${esc(p.addr)}</p>` : ''}
      ${p.near ? `<p class="p-row"><b>Zona:</b> ${esc(p.near)}${p.aprox ? ' — confirma la dirección exacta por WhatsApp.' : ''}</p>` : ''}
      ${p.hours ? `<p class="p-row"><b>Horario:</b> ${esc(p.hours)}</p>` : ''}
      ${p.tel ? `<p class="p-row"><b>Teléfono:</b> ${esc(p.tel)}</p>` : ''}
      <div class="p-actions">${actions.join('')}</div>
      ${L.club ? `<a class="club" target="_blank" rel="noopener" href="${L.club}"><b>Club de Beneficios Tânia Alves</b>Quien se hospeda con nuestra socia tiene acceso a descuentos. Toca para consultar.</a>` : ''}
    `;
    $('#sheet').hidden = false;
    $('#sheet').scrollTop = 0;
    document.body.classList.add('sheet-open');
    hideHint();
    // deja el pin visible en la parte de arriba, por encima de la ficha
    const dy = window.innerWidth < 720 ? Math.round(window.innerHeight * 0.22) : 0;
    map.fly(p, fly ? 16 : map.zoom(), dy);
    history.replaceState(null, '', '#' + p.id);
  }
  function closeSheet() {
    if ($('#sheet').hidden) return;
    $('#sheet').hidden = true;
    document.body.classList.remove('sheet-open');
    markers.forEach(m => m.el.classList.remove('is-active'));
    current = null;
    history.replaceState(null, '', location.pathname + location.search);
  }
  $('#sheet-close').addEventListener('click', closeSheet);

  // ---------- list ----------
  function renderList() {
    const items = PLACES.filter(p => p.cat !== 'unicpo' && active.has(p.cat))
      .map(p => ({ p, dl: distLabel(p) }))
      .sort((a, b) => a.dl.d - b.dl.d);
    $('#list-sub').textContent = items.length ? `${items.length} lugares · ordenados por distancia desde UniCPO` : 'Activa alguna categoría arriba para ver lugares.';
    $('#list-items').innerHTML = items.map(({ p, dl }) => {
      const c = CATS[p.cat];
      const ico = isRich(p) ? `<span class="li__ico" style="--c:${c.c};background-image:url('${PHOTO_DIR + p.photos[0]}')"></span>` : `<span class="li__ico" style="--c:${c.c}">${c.ico}</span>`;
      return `<li><button class="li" data-id="${p.id}">${ico}<span class="li__txt"><span class="li__name">${esc(p.name)}</span><span class="li__sub">${c.label}${p.rating ? ' · ⭐ ' + esc(p.rating) : ''}${p.partner ? ' · Socia UniCPO' : ''}</span></span><span class="li__d">${dl.short}</span></button></li>`;
    }).join('');
  }
  function closeList() { $('#list').hidden = true; }
  $('#btn-list').addEventListener('click', () => {
    if (!$('#list').hidden) return closeList();
    closeSheet(); renderList(); $('#list').hidden = false; $('#list').scrollTop = 0; hideHint();
  });
  $('#list-close').addEventListener('click', closeList);
  $('#list-items').addEventListener('click', e => {
    const b = e.target.closest('[data-id]'); if (!b) return;
    const p = PLACES.find(x => x.id === b.dataset.id); if (p) openPlace(p, true);
  });

  // ---------- misc ----------
  function hideHint() { $('#hint').classList.add('is-hidden'); }
  setTimeout(hideHint, 9000);
  $('#btn-home').addEventListener('click', () => { closeSheet(); map.fly(HOME, 15); });
  let me = null;
  $('#btn-me').addEventListener('click', () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const p = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      if (!me) { const el = document.createElement('div'); el.className = 'mk'; el.innerHTML = '<div class="mk-me"></div>'; me = map.add(p, el, 900); }
      map.fly(p, 16);
    }, () => alert('No pudimos obtener tu ubicación. Revisa los permisos del navegador.'), { enableHighAccuracy: true, timeout: 10000 });
  });

  // ---------- boot ----------
  function boot(provider) {
    map = provider;
    zoomClass(15);
    map.circle(400, '5 min a pie');
    map.circle(800, '10 min a pie');
    const sorted = [...PLACES].sort((a, b) => b.lat - a.lat);
    sorted.forEach(p => {
      const el = markerEl(p);
      const z = p.cat === 'unicpo' ? 800 : isRich(p) ? 500 : p.psd ? 100 : 0;
      const handle = map.add(p, el, z, () => openPlace(p, false));
      markers.set(p.id, { place: p, el, handle });
    });
    renderChips();
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id && PLACES.find(p => p.id === id);
    if (target) openPlace(target, true);
  }
  window.addEventListener('hashchange', () => {
    const p = PLACES.find(x => x.id === decodeURIComponent(location.hash.slice(1)));
    if (p && p !== current) openPlace(p, true);
  });

  const key = (window.MAP_CONFIG || {}).googleMapsApiKey;
  if (key) {
    window.__initGoogle = () => boot(googleProvider());
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&language=es&region=BR&callback=__initGoogle`;
    s.async = true;
    s.onerror = () => boot(leafletProvider());
    document.head.appendChild(s);
  } else {
    boot(leafletProvider());
  }
})();
