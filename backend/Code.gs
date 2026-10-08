/**
 * Backend del mapa "Todo cerca de UniCPO" — Google Apps Script ligado a una Planilla de Google.
 *
 * Hojas:
 *   - "Votos": la nota de los alumnos (1 voto por dispositivo y lugar; si vuelve a votar, se actualiza).
 *   - "Reportes": avisos de dirección/horario incorrecto o lugar cerrado. NO son públicos.
 *     Si 3 dispositivos distintos reportan "cerró" (Estado = Pendiente), el mapa muestra "Posiblemente cerrado".
 *   - "Correcciones": lo que el equipo quiere cambiar en el mapa. Un robot de GitHub lo lee cada lunes
 *     (acción "export") y vuelve a publicar el sitio.
 *   - "Lugares": lista de todos los lugares del mapa con su ID (se actualiza sola cada lunes).
 *
 * Instalación: ver backend/README.md
 */

const CONFIG = {
  NOTIFY_EMAIL: true,          // envía un e-mail por cada reporte nuevo (a quién: hoja "Config")
  MAX_VOTES_PER_HOUR: 40,      // por dispositivo
  MAX_REPORTS_PER_DAY: 5,      // por dispositivo
  STATS_CACHE_SECONDS: 60,
  CLOSED_THRESHOLD: 3,         // reportes "cerró" de dispositivos distintos para mostrar "Posiblemente cerrado"
  SITE_URL: 'https://unicpobauru.github.io/mapa-unicpo/',
};

const SHEETS = {
  votes: { name: 'Votos', headers: ['Fecha', 'Lugar ID', 'Lugar', 'Dispositivo', 'Estrellas', 'Comunicación'] },
  reports: { name: 'Reportes', headers: ['Fecha', 'Lugar ID', 'Lugar', 'Tipo', 'Detalle', 'Dispositivo', 'Estado', 'Notas del equipo'] },
  corrections: {
    name: 'Correcciones',
    headers: ['Lugar ID', 'Estado', 'Nombre', 'Categoría', 'Dirección', 'Horario', 'Teléfono', 'Instagram', 'Descripción', 'Latitud', 'Longitud', 'Nota interna (no se publica)'],
  },
  places: { name: 'Lugares', headers: ['Lugar ID', 'Nombre', 'Categoría', 'Dirección', 'Ver en el mapa'] },
  config: { name: 'Config', headers: ['Configuración', 'Valor'] },
};

const COMM = ['facil', 'esfuerzo', 'dificil'];
const REPORT_TYPES = { direccion: 'Dirección/ubicación incorrecta', horario: 'Horario incorrecto', cerrado: 'El lugar cerró', otro: 'Otro' };
const REPORT_STATES = ['Pendiente', 'Resuelto', 'Descartado'];
const PLACE_STATES = ['Activo', 'Cerrado'];
const CATEGORIES = ['restaurante', 'fastfood', 'bar', 'cafe', 'hotel', 'airbnb', 'farmacia', 'mercado', 'parque', 'salud', 'cambio', 'shopping', 'gimnasio', 'transporte'];

// ---------- HTTP ----------

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'stats';
  if (action === 'stats') return json_(getStats_());
  if (action === 'export') return json_(exportCorrections_());
  return json_({ ok: false, error: 'acción desconocida' });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'JSON inválido' });
  }
  if (body.website) return json_({ ok: true }); // honeypot: los bots llenan este campo oculto

  const placeId = String(body.placeId || '');
  const device = String(body.device || '');
  if (!/^[a-z0-9-]{2,60}$/.test(placeId) || !/^[a-z0-9-]{8,64}$/.test(device)) {
    return json_({ ok: false, error: 'datos inválidos' });
  }
  const placeName = String(body.placeName || '').slice(0, 120);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (body.action === 'vote') return json_(saveVote_(placeId, placeName, device, body));
    if (body.action === 'report') return json_(saveReport_(placeId, placeName, device, body));
    return json_({ ok: false, error: 'acción desconocida' });
  } finally {
    lock.releaseLock();
  }
}

// ---------- Votos ----------

function saveVote_(placeId, placeName, device, body) {
  const stars = Number(body.stars);
  const comm = String(body.comm || '');
  if (!(stars >= 1 && stars <= 5 && Math.round(stars) === stars) || COMM.indexOf(comm) < 0) {
    return { ok: false, error: 'voto inválido' };
  }
  if (!withinLimit_('v:' + device, CONFIG.MAX_VOTES_PER_HOUR, 3600)) {
    return { ok: false, error: 'Demasiados votos seguidos. Intenta más tarde.' };
  }

  const sh = sheet_(SHEETS.votes);
  const last = sh.getLastRow();
  const row = [new Date(), placeId, placeName, device, stars, comm];
  if (last > 1) {
    // Si este dispositivo ya votó este lugar, se reemplaza el voto anterior
    const keys = sh.getRange(2, 2, last - 1, 3).getValues(); // Lugar ID, Lugar, Dispositivo
    for (let i = 0; i < keys.length; i++) {
      if (keys[i][0] === placeId && keys[i][2] === device) {
        sh.getRange(i + 2, 1, 1, row.length).setValues([row]);
        CacheService.getScriptCache().remove('stats');
        return { ok: true, updated: true, stats: getStats_()[placeId] || null };
      }
    }
  }
  sh.appendRow(row);
  CacheService.getScriptCache().remove('stats');
  return { ok: true, updated: false, stats: getStats_()[placeId] || null };
}

/** { <placeId>: {n, avg, comm}, _closed: { <placeId>: <nº de dispositivos que reportaron "cerró"> } } */
function getStats_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('stats');
  if (hit) return JSON.parse(hit);

  const out = {};
  const sh = sheet_(SHEETS.votes);
  const last = sh.getLastRow();
  if (last > 1) {
    const rows = sh.getRange(2, 2, last - 1, 5).getValues(); // Lugar ID, Lugar, Dispositivo, Estrellas, Comunicación
    rows.forEach(r => {
      const id = r[0], stars = Number(r[3]), comm = r[4];
      if (!id || !(stars >= 1 && stars <= 5)) return;
      const s = out[id] || (out[id] = { n: 0, sum: 0, comm: { facil: 0, esfuerzo: 0, dificil: 0 } });
      s.n++; s.sum += stars;
      if (s.comm[comm] !== undefined) s.comm[comm]++;
    });
    Object.keys(out).forEach(id => {
      out[id].avg = Math.round(out[id].sum / out[id].n * 10) / 10;
      delete out[id].sum;
    });
  }
  out._closed = closedFlags_();
  cache.put('stats', JSON.stringify(out), CONFIG.STATS_CACHE_SECONDS);
  return out;
}

/** Lugares con reportes "cerró" pendientes de >= CLOSED_THRESHOLD dispositivos distintos. */
function closedFlags_() {
  const sh = sheet_(SHEETS.reports);
  const last = sh.getLastRow();
  const devices = {};
  if (last > 1) {
    sh.getRange(2, 2, last - 1, 6).getValues().forEach(r => { // Lugar ID, Lugar, Tipo, Detalle, Dispositivo, Estado
      if (r[2] !== REPORT_TYPES.cerrado || String(r[5]).trim() !== 'Pendiente') return;
      (devices[r[0]] = devices[r[0]] || {})[r[4]] = true;
    });
  }
  const flags = {};
  Object.keys(devices).forEach(id => {
    const n = Object.keys(devices[id]).length;
    if (n >= CONFIG.CLOSED_THRESHOLD) flags[id] = n;
  });
  return flags;
}

// ---------- Reportes ----------

function saveReport_(placeId, placeName, device, body) {
  const tipo = String(body.tipo || '');
  const detalle = String(body.detalle || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  if (!REPORT_TYPES[tipo]) return { ok: false, error: 'tipo inválido' };
  if (tipo === 'otro' && detalle.length < 5) return { ok: false, error: 'Describe el problema' };
  if (body.confirmed !== true) return { ok: false, error: 'Falta la confirmación' };

  const cache = CacheService.getScriptCache();
  const dupKey = 'r:' + device + ':' + placeId + ':' + tipo;
  if (cache.get(dupKey)) return { ok: true, duplicate: true };
  if (!withinLimit_('rl:' + device, CONFIG.MAX_REPORTS_PER_DAY, 21600)) {
    return { ok: false, error: 'Llegaste al límite de reportes por hoy. ¡Gracias por ayudar!' };
  }

  sheet_(SHEETS.reports).appendRow([new Date(), placeId, placeName, REPORT_TYPES[tipo], detalle, device, 'Pendiente', '']);
  cache.put(dupKey, '1', 21600);
  cache.remove('stats'); // para que "Posiblemente cerrado" aparezca sin esperar

  if (CONFIG.NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail({
        to: notifyEmails_(),
        subject: '[Mapa UniCPO] Reporte: ' + REPORT_TYPES[tipo] + ' — ' + placeName,
        body: 'Lugar: ' + placeName + ' (' + placeId + ')\nTipo: ' + REPORT_TYPES[tipo] + '\nDetalle: ' + (detalle || '—') +
          '\n\nRevisa la hoja "Reportes" de la planilla:\n' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      });
    } catch (err) { /* sin e-mail no se pierde el reporte */ }
  }
  return { ok: true };
}

// ---------- Correcciones (las lee el robot semanal de GitHub) ----------

function exportCorrections_() {
  const sh = sheet_(SHEETS.corrections);
  const last = sh.getLastRow();
  const out = [];
  if (last > 1) {
    const rows = sh.getRange(2, 1, last - 1, 11).getValues(); // sin la "Nota interna"
    rows.forEach((r, i) => {
      const txt = (v, max) => String(v === null || v === undefined ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
      const num = v => (v === '' || v === null || isNaN(Number(String(v).replace(',', '.')))) ? null : Number(String(v).replace(',', '.'));
      const c = {
        row: i + 2,
        id: txt(r[0], 60).toLowerCase(),
        estado: txt(r[1], 20),
        name: txt(r[2], 120),
        cat: txt(r[3], 20).toLowerCase(),
        addr: txt(r[4], 160),
        hours: txt(r[5], 200),
        tel: txt(r[6], 40),
        ig: txt(r[7], 40).replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/.*$/, ''),
        info: txt(r[8], 300),
        lat: num(r[9]),
        lon: num(r[10]),
      };
      const hasSomething = Object.keys(c).some(k => k !== 'row' && c[k] !== '' && c[k] !== null);
      if (hasSomething) out.push(c);
    });
  }
  return { ok: true, generated: new Date().toISOString(), corrections: out };
}

// ---------- Lista de lugares (para elegir el ID sin errores) ----------

/** Lee los lugares publicados en el sitio y rellena la hoja "Lugares" + las listas desplegables. */
function actualizarListaDeLugares() {
  const res = UrlFetchApp.fetch(CONFIG.SITE_URL + 'data/places.js?t=' + Date.now(), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('No se pudo leer el sitio: HTTP ' + res.getResponseCode());
  const txt = res.getContentText();
  const places = JSON.parse(txt.slice(txt.indexOf('['), txt.lastIndexOf(']') + 1))
    .filter(p => p.cat !== 'unicpo')
    .sort((a, b) => (a.cat + a.name).localeCompare(b.cat + b.name));

  const sh = sheet_(SHEETS.places);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, SHEETS.places.headers.length).clearContent();
  if (places.length) {
    sh.getRange(2, 1, places.length, 5).setValues(places.map(p => [p.id, p.name, p.cat, p.addr || '', CONFIG.SITE_URL + '#' + p.id]));
  }
  sh.autoResizeColumns(1, 4);
  setupCorrectionsSheet_(places.length);
  Logger.log('Lugares actualizados: ' + places.length);
}

function setupCorrectionsSheet_(nPlaces) {
  const sh = sheet_(SHEETS.corrections);
  const rows = 500;
  const list = vals => SpreadsheetApp.newDataValidation().requireValueInList(vals, true).setAllowInvalid(false).build();
  // Lugar ID: lista de la hoja "Lugares" (se permite un ID vacío para lugares NUEVOS)
  const lugares = sheet_(SHEETS.places).getRange(2, 1, Math.max(nPlaces || 1, 1), 1);
  sh.getRange(2, 1, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(lugares, true).setAllowInvalid(false).build());
  sh.getRange(2, 2, rows, 1).setDataValidation(list(PLACE_STATES));
  sh.getRange(2, 4, rows, 1).setDataValidation(list(CATEGORIES));
  sh.getRange(1, 1, 1, SHEETS.corrections.headers.length).clearNote();
  sh.getRange('A1').setNote('Elige el lugar de la lista. Déjalo VACÍO solo para agregar un lugar nuevo (entonces llena Nombre, Categoría, Latitud y Longitud).');
  sh.getRange('B1').setNote('"Cerrado" saca el lugar del mapa. Vacío = no cambia.');
  sh.getRange('C1').setNote('Llena solo las columnas que cambian. Las vacías se quedan como están.');
  sh.getRange('J1').setNote('En Google Maps: clic derecho sobre el lugar → copia los números (ej.: -22.3304, -49.0622).');
}

// ---------- Config (quién recibe los e-mails de reporte) ----------

const CONFIG_EMAILS_LABEL = 'E-mails que reciben los reportes (separados por coma)';

/** Crea la fila de e-mails en la hoja "Config" si todavía no existe (no pisa lo que el equipo ya escribió). */
function setupConfigSheet_() {
  const sh = sheet_(SHEETS.config);
  const labels = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(r => r[0]) : [];
  if (labels.indexOf(CONFIG_EMAILS_LABEL) < 0) {
    sh.appendRow([CONFIG_EMAILS_LABEL, Session.getEffectiveUser().getEmail()]);
  }
  sh.autoResizeColumns(1, 2);
}

/** E-mails de la hoja "Config"; si está vacía o inválida, el dueño de la planilla. */
function notifyEmails_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.config.name);
  let list = [];
  if (sh && sh.getLastRow() > 1) {
    const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
    const row = rows.find(r => r[0] === CONFIG_EMAILS_LABEL);
    if (row) list = String(row[1]).split(/[,;\s]+/).map(s => s.trim()).filter(s => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s));
  }
  return (list.length ? list : [Session.getEffectiveUser().getEmail()]).join(',');
}

function setupReportsSheet_() {
  const sh = sheet_(SHEETS.reports);
  sh.getRange(2, 7, 1000, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(REPORT_STATES, true).setAllowInvalid(true).build());
}

// ---------- Menú en la planilla ----------

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Mapa UniCPO')
    .addItem('Actualizar lista de lugares', 'actualizarListaDeLugares')
    .addItem('Ver el mapa', 'abrirMapa')
    .addToUi();
}

function abrirMapa() {
  const html = HtmlService.createHtmlOutput('<script>window.open("' + CONFIG.SITE_URL + '");google.script.host.close();</script>');
  SpreadsheetApp.getUi().showModalDialog(html, 'Abriendo el mapa…');
}

// ---------- utilidades ----------

function withinLimit_(key, max, seconds) {
  const cache = CacheService.getScriptCache();
  const n = Number(cache.get(key) || 0);
  if (n >= max) return false;
  cache.put(key, String(n + 1), seconds);
  return true;
}

function sheet_(def) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(def.name);
  if (!sh) {
    sh = ss.insertSheet(def.name);
    sh.getRange(1, 1, 1, def.headers.length).setValues([def.headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ejecuta esto desde el editor (la primera vez y cada vez que actualices este código):
 * crea las hojas, las listas desplegables y el disparador semanal de "Lugares".
 */
function setup() {
  sheet_(SHEETS.votes);
  sheet_(SHEETS.reports);
  sheet_(SHEETS.corrections);
  sheet_(SHEETS.places);
  setupConfigSheet_();
  setupReportsSheet_();
  actualizarListaDeLugares();

  const exists = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'actualizarListaDeLugares');
  if (!exists) {
    ScriptApp.newTrigger('actualizarListaDeLugares').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(6).create();
  }
  Logger.log('Listo. Si cambiaste el código: Implementar > Gestionar implementaciones > editar > Nueva versión.');
}
