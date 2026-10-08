// Genera data/places.js a partir de google-places.tsv + curated.mjs + psd-pins.json + instagram.json
// Uso: node data/build.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { UNICPO, HOSPEDAJE, GUIA, PSD_EXTRA, EXTRAS } from './curated.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const dist = (a, b) => Math.hypot((a.lat - b.lat) * 110574, (a.lon - b.lon) * 102970);

// El id identifica el lugar en los votos y reportes guardados en la planilla:
// tiene que ser estable aunque cambie el orden del TSV, así que sale del nombre + coordenada.
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const coordTag = (lat, lon) => {
  let h = 0;
  for (const ch of `${(+lat).toFixed(4)},${(+lon).toFixed(4)}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h.toString(36).slice(-4);
};

const curated = [...UNICPO, ...HOSPEDAJE, ...GUIA, ...PSD_EXTRA, ...EXTRAS];
const CAT_MAP = { farmacia: 'farmacia', restaurante: 'restaurante', bar: 'bar', mercado: 'mercado', cafe: 'cafe', saude: 'salud', cambio: 'cambio', hotel: 'hotel', academia: 'gimnasio' };

const rows = fs.readFileSync(path.join(dir, 'google-places.tsv'), 'utf8').trim().split(/\r?\n/).slice(1);
const google = rows.map(l => {
  const [cat, name, lat, lon, rating, reviews, extra] = l.split('\t');
  return { id: `${slug(name)}-${coordTag(lat, lon)}`, cat: CAT_MAP[cat], name, lat: +lat, lon: +lon, rating: rating || undefined, reviews: reviews ? +reviews : undefined, info: extra || undefined };
}).filter(g => !curated.some(c => dist(c, g) < 40 && c.name.split(' ')[0].toLowerCase() === g.name.split(' ')[0].toLowerCase()));

// Marca los lugares que aparecen en el PSD del episodio (pin a < 60 m de la misma categoría)
const PSD_CATS = { 'Farmácias': ['farmacia'], 'Restaurantes': ['restaurante', 'cafe', 'bar'], 'Bares': ['bar', 'restaurante'], 'Mercado': ['mercado'] };
const pins = JSON.parse(fs.readFileSync(path.join(dir, 'psd-pins.json'), 'utf8'));
const all = [...curated, ...google];
for (const p of pins) {
  const cands = all.filter(x => (PSD_CATS[p.cat] || []).includes(x.cat)).map(x => [x, dist(x, p)]).sort((a, b) => a[1] - b[1]);
  if (cands[0] && cands[0][1] < 60) cands[0][0].psd = true;
}

// Instagram: { "id-del-lugar": "usuario" } (sin @)
const igFile = path.join(dir, 'instagram.json');
const ig = fs.existsSync(igFile) ? JSON.parse(fs.readFileSync(igFile, 'utf8')) : {};
for (const p of all) if (ig[p.id]) p.ig = ig[p.id];
const unknownIg = Object.keys(ig).filter(id => !all.some(p => p.id === id));
if (unknownIg.length) console.warn('instagram.json tiene ids que no existen:', unknownIg.join(', '));

const ids = all.map(p => p.id);
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dup.length) throw new Error('ids duplicados: ' + dup.join(', '));

fs.writeFileSync(path.join(dir, 'places.js'), '// Generado por data/build.mjs — no editar a mano\nwindow.PLACES = ' + JSON.stringify(all, null, 0).replace(/},{/g, '},\n{') + ';\n');
console.log('places:', all.length, '| en el PSD:', all.filter(x => x.psd).length, '| con Instagram:', all.filter(x => x.ig).length);
