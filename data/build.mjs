// Genera data/places.js a partir de google-places.tsv + curated.mjs + psd-pins.json
// Uso: node data/build.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { UNICPO, HOSPEDAJE, GUIA, PSD_EXTRA, EXTRAS } from './curated.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const dist = (a, b) => Math.hypot((a.lat - b.lat) * 110574, (a.lon - b.lon) * 102970);

const curated = [...UNICPO, ...HOSPEDAJE, ...GUIA, ...PSD_EXTRA, ...EXTRAS];
const CAT_MAP = { farmacia: 'farmacia', restaurante: 'restaurante', bar: 'bar', mercado: 'mercado', cafe: 'cafe', saude: 'salud', cambio: 'cambio', hotel: 'hotel', academia: 'gimnasio' };

const rows = fs.readFileSync(path.join(dir, 'google-places.tsv'), 'utf8').trim().split(/\r?\n/).slice(1);
const google = rows.map((l, i) => {
  const [cat, name, lat, lon, rating, reviews, extra] = l.split('\t');
  return { id: 'g' + i, cat: CAT_MAP[cat], name, lat: +lat, lon: +lon, rating: rating || undefined, reviews: reviews ? +reviews : undefined, info: extra || undefined };
}).filter(g => !curated.some(c => dist(c, g) < 40 && c.name.split(' ')[0].toLowerCase() === g.name.split(' ')[0].toLowerCase()));

// Marca los lugares que aparecen en el PSD del episodio (pin a < 60 m de la misma categoría)
const PSD_CATS = { 'Farmácias': ['farmacia'], 'Restaurantes': ['restaurante', 'cafe', 'bar'], 'Bares': ['bar', 'restaurante'], 'Mercado': ['mercado'] };
const pins = JSON.parse(fs.readFileSync(path.join(dir, 'psd-pins.json'), 'utf8'));
const all = [...curated, ...google];
for (const p of pins) {
  const cands = all.filter(x => (PSD_CATS[p.cat] || []).includes(x.cat)).map(x => [x, dist(x, p)]).sort((a, b) => a[1] - b[1]);
  if (cands[0] && cands[0][1] < 60) cands[0][0].psd = true;
}

fs.writeFileSync(path.join(dir, 'places.js'), '// Generado por data/build.mjs — no editar a mano\nwindow.PLACES = ' + JSON.stringify(all, null, 0).replace(/},{/g, '},\n{') + ';\n');
console.log('places:', all.length, '| en el PSD:', all.filter(x => x.psd).length);
