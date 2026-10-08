/**
 * Backend del mapa "Todo cerca de UniCPO" — Google Apps Script ligado a una Planilla de Google.
 *
 * Guarda:
 *   - Hoja "Votos": la nota de los alumnos (1 voto por dispositivo y lugar; si vuelve a votar, se actualiza).
 *   - Hoja "Reportes": avisos de dirección/horario incorrecto o lugar cerrado. NO son públicos:
 *     el equipo los revisa en la planilla y cambia el mapa si corresponde.
 *
 * Instalación: ver backend/README.md
 */

const CONFIG = {
  NOTIFY_EMAIL: true,          // envía un e-mail al dueño de la planilla por cada reporte nuevo
  MAX_VOTES_PER_HOUR: 40,      // por dispositivo
  MAX_REPORTS_PER_DAY: 5,      // por dispositivo
  STATS_CACHE_SECONDS: 60,
};

const SHEETS = {
  votes: { name: 'Votos', headers: ['Fecha', 'Lugar ID', 'Lugar', 'Dispositivo', 'Estrellas', 'Comunicación'] },
  reports: { name: 'Reportes', headers: ['Fecha', 'Lugar ID', 'Lugar', 'Tipo', 'Detalle', 'Dispositivo', 'Estado', 'Notas del equipo'] },
};

const COMM = ['facil', 'esfuerzo', 'dificil'];
const REPORT_TYPES = { direccion: 'Dirección/ubicación incorrecta', horario: 'Horario incorrecto', cerrado: 'El lugar cerró', otro: 'Otro' };

// ---------- HTTP ----------

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'stats';
  if (action === 'stats') return json_(getStats_());
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

function getStats_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('stats');
  if (hit) return JSON.parse(hit);

  const sh = sheet_(SHEETS.votes);
  const last = sh.getLastRow();
  const out = {};
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
  cache.put('stats', JSON.stringify(out), CONFIG.STATS_CACHE_SECONDS);
  return out;
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

  if (CONFIG.NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail({
        to: Session.getEffectiveUser().getEmail(),
        subject: '[Mapa UniCPO] Reporte: ' + REPORT_TYPES[tipo] + ' — ' + placeName,
        body: 'Lugar: ' + placeName + ' (' + placeId + ')\nTipo: ' + REPORT_TYPES[tipo] + '\nDetalle: ' + (detalle || '—') +
          '\n\nRevisa la hoja "Reportes" de la planilla:\n' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      });
    } catch (err) { /* sin e-mail no se pierde el reporte */ }
  }
  return { ok: true };
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

/** Ejecuta esto una vez desde el editor para crear las hojas y autorizar el script. */
function setup() {
  sheet_(SHEETS.votes);
  sheet_(SHEETS.reports);
  Logger.log('Listo. Ahora: Implementar > Nueva implementación > Aplicación web.');
}
