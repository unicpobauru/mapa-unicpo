// Lugares curados a mano (PDF "Etapas y Trámites del Viaje", PDF "¿Qué hacer en Bauru?" y PSD del episodio).
// Coordenadas verificadas en Google Maps (oct/2026). `aprox: true` = ubicación aproximada, confirmar con el anfitrión.

const WA_TANIA = 'https://wa.me/5514997762959';
const CLUB_TANIA = 'https://drive.google.com/file/d/1TFcydsAy_OjfL4YdSOMAE88G5crs8sjz/view?usp=sharing';

export const UNICPO = [
  { id: 'unicpo-sede', cat: 'unicpo', name: 'UniCPO · Edificio nuevo', lat: -22.33040, lon: -49.06221,
    addr: 'R. Ver. Joaquim da Silva Martha, 21-50 · Vila Nova Cidade Universitária', info: 'Aquí son las clases. Punto de partida de todas las distancias.' },
  { id: 'unicpo-hp', cat: 'unicpo', name: 'UniCPO · Edificio Hermínio Pinto', lat: -22.32866, lon: -49.06047,
    addr: 'R. Hermínio Pinto, Quadra 13 · Vila Brunhari', info: 'Unidad Nações (edificio antiguo).' },
];

export const HOSPEDAJE = [
  // --- Aliada Tânia Alves (Airbnb / apartamentos) ---
  { id: 'tania-casa-1', cat: 'airbnb', name: 'Tânia Alves · Airbnb Casa 1', lat: -22.32795, lon: -49.05985, aprox: true, partner: true,
    info: 'Ideal para compartir con compañeros: buen precio al dividir entre varios.',
    near: 'Cerca del edificio Hermínio Pinto', photos: ['tania-casa-1.jpg'],
    links: { site: 'https://drive.google.com/file/d/190WyHszy9Rkc0PKJ98-Dn-IVLmr1ricn/view?usp=sharing', whatsapp: WA_TANIA, club: CLUB_TANIA } },
  { id: 'tania-casa-2', cat: 'airbnb', name: 'Tânia Alves · Airbnb Casa 2', lat: -22.33115, lon: -49.06150, aprox: true, partner: true,
    info: 'Ideal para compartir con compañeros: buen precio al dividir entre varios.',
    near: 'Cerca del edificio nuevo', photos: ['tania-casa-2.jpg'],
    links: { site: 'https://drive.google.com/file/d/1TJmsqH-RatkTy5y0GNOR7QBu4SZA7Xtj/view?usp=drive_link', whatsapp: WA_TANIA, club: CLUB_TANIA } },
  { id: 'tania-res-vr', cat: 'airbnb', name: 'Residencial Vitória Régia · Tânia Alves', lat: -22.329109, lon: -49.059225, partner: true,
    rating: '3,9', reviews: 13, info: 'Apartamento amueblado. Hasta 2 huéspedes.', addr: 'R. Raposo Tavares, 11-45',
    photos: ['tania-residencial-vr.jpg'],
    links: { site: 'https://drive.google.com/file/d/1Dx8_tjHSYu0IXEpaaGyVJdDusIhGLyjv/view?usp=drive_link', whatsapp: WA_TANIA, club: CLUB_TANIA } },
  { id: 'tania-ibis-eco', cat: 'airbnb', name: 'Depto. "Ibis Económico" · Tânia Alves', lat: -22.33160, lon: -49.06305, aprox: true, partner: true,
    info: 'Departamento hasta 4 huéspedes.', near: 'Cerca del edificio nuevo', photos: ['tania-ibis-economico.jpg'],
    links: { site: 'https://drive.google.com/file/d/17mLvxNr43mpZl4fSBAjvEUlbDVc_Sm7t/view?usp=drive_link', whatsapp: WA_TANIA, club: CLUB_TANIA } },
  { id: 'tania-ibis-ejec', cat: 'airbnb', name: 'Depto. "Ibis Ejecutivo" · Tânia Alves', lat: -22.32965, lon: -49.06330, aprox: true, partner: true,
    info: 'TV en la habitación y muebles más modernos. Hasta 4 huéspedes.', near: 'Cerca del edificio nuevo', photos: ['tania-ibis-ejecutivo.jpg'],
    links: { site: 'https://drive.google.com/file/d/17mLvxNr43mpZl4fSBAjvEUlbDVc_Sm7t/view?usp=drive_link', whatsapp: WA_TANIA, club: CLUB_TANIA } },

  // --- Hoteles muy cercanos (a pie) ---
  { id: 'hotel-alfa', cat: 'hotel', name: 'Alfa Apart Hotel', lat: -22.330207, lon: -49.061507, rating: '4,1', reviews: 194,
    info: 'Habitaciones para 1 a 3 personas.', addr: 'R. Ver. Joaquim da Silva Martha, 22-12', tel: '(14) 3224-3288', photos: ['hotel-alfa.jpg'],
    links: { site: 'https://www.booking.com/hotel/br/alfa-apart.es.html' } },
  { id: 'hotel-vitoria-regia', cat: 'hotel', name: 'Vitória Régia Hotel', lat: -22.330017, lon: -49.058468, rating: '4,5', reviews: 1233,
    info: 'Habitaciones para 1 a 3 personas.', addr: 'Av. Nações Unidas, 21-81', tel: '(14) 99634-5401', photos: ['hotel-vitoria-regia.jpg'],
    links: { site: 'https://book.omnibees.com/hotelresults?CheckIn=&CheckOut=&ad=1&lang=es-ES&q=6015&currencyId=16' } },
  { id: 'astor-hotel', cat: 'hotel', name: 'Astor Hotel', lat: -22.332163, lon: -49.059484, rating: '4,3', reviews: 902,
    info: 'Habitaciones para 1 a 3 personas.', addr: 'R. Maria da Conceição Arantes Ramos, 4-40', tel: '(14) 3879-1600', photos: ['astor-hotel.jpg'],
    links: { site: 'https://www.booking.com/hotel/br/astor.es.html' } },

  // --- Hoteles más alejados (auto / Uber) ---
  { id: 'nacional-inn', cat: 'hotel', far: true, name: 'Hotel Nacional Inn', lat: -22.335947, lon: -49.054223, rating: '4,3', reviews: 1809,
    addr: 'Av. Nações Unidas, 29-16', tel: '(14) 2109-8380', photos: ['nacional-inn.jpg'], links: { site: 'https://www.nacionalinn.com.br' } },
  { id: 'blue-tree-garden', cat: 'hotel', far: true, name: 'Blue Tree Garden', lat: -22.336623, lon: -49.051745, rating: '4,4', reviews: 1484,
    addr: 'R. Dr. Alípio dos Santos, 10-14', tel: '(14) 3235-7712', photos: ['blue-tree-garden.jpg'],
    links: { site: 'https://www.booking.com/hotel/br/blue-tree-garden-bauru.es.html' } },
  { id: 'blue-tree-towers', cat: 'hotel', far: true, name: 'Blue Tree Towers', lat: -22.337114, lon: -49.051207, rating: '4,5', reviews: 2299,
    addr: 'R. Júlio de Mesquita Filho, 10-36', tel: '(14) 3235-8700', photos: ['blue-tree-towers.jpg'],
    links: { site: 'https://www.airbnb.com.br/rooms/1504353281032056084' } },
  { id: 'comfort-hotel', cat: 'hotel', far: true, name: 'Comfort Hotel', lat: -22.340063, lon: -49.050818, rating: '4,6', reviews: 1996,
    addr: 'Av. Nações Unidas, 36-14', tel: '(14) 3236-8400', photos: ['comfort-hotel.jpg'],
    links: { site: 'https://www.booking.com/hotel/br/comfort-bauru.es.html' } },
  { id: 'tulip-inn', cat: 'hotel', far: true, name: 'Tulip Inn Bauru', lat: -22.342588, lon: -49.054018, rating: '4,4', reviews: 156,
    addr: 'R. Eng. Alpheu José Ribas Sampaio, 1-23', tel: '(14) 3227-1100', photos: ['tulip-inn.jpg'],
    links: { site: 'https://www.booking.com/hotel/br/tulip-inn-bauru.es.html' } },
  { id: 'astron-hotel', cat: 'hotel', far: true, name: 'Astron Hotel by Nobile', lat: -22.339040, lon: -49.066652, rating: '4,3', reviews: 1137,
    addr: 'R. Luso-Brasileira, 4-44', tel: '(14) 2109-7777', photos: ['astron-hotel.jpg'],
    links: { site: 'https://www.booking.com/hotel/br/astron-hotel-bauru.es.html' } },
  { id: 'metropolitan-square', cat: 'hotel', far: true, name: 'Metropolitan Square', lat: -22.339134, lon: -49.066780, rating: '4,7', reviews: 290,
    addr: 'R. Luso-Brasileira, 4-44', photos: ['metropolitan-square.jpg'],
    links: { site: 'https://www.booking.com/hotel/br/astron-nobile.es.html' } },
  { id: 'biazi-plaza', cat: 'hotel', far: true, name: 'Biazi Plaza Hotel', lat: -22.316799, lon: -49.069713, rating: '4,7', reviews: 1003,
    addr: 'Av. Nações Unidas, 5-60 · Centro', tel: '(14) 2108-2108', photos: ['biazi-plaza.jpg'],
    links: { site: 'https://www.booking.com/hotel/br/biazi-plaza.es.html' } },
  { id: 'intercity', cat: 'hotel', far: true, name: 'Hotel Intercity Bauru', lat: -22.356290, lon: -49.048401, rating: '4,5', reviews: 2079,
    addr: 'R. José Antônio Braga, 4-50', tel: '(14) 3201-5900', photos: ['intercity.jpg'],
    links: { site: 'https://www.booking.com/hotel/br/intercity-bauru.es.html' } },
];

// Guía "¿Qué hacer en Bauru?" (Customer Success)
export const GUIA = [
  { id: 'g-bongo', cat: 'restaurante', guia: true, name: 'Bongo Tex-Mex', lat: -22.338497, lon: -49.061553, rating: '4,5', reviews: 1355,
    info: 'Cocina mexicana.', addr: 'R. Araújo Leite, 33-59', hours: 'Lun–sáb 18:15–23:00 · Dom y feriados cerrado' },
  { id: 'g-pamavi', cat: 'restaurante', guia: true, name: 'Pamavi Chapeados', lat: -22.334332, lon: -49.054125, rating: '4,8', reviews: 490,
    info: 'Porciones a la plancha, cortes de carne, bocadillos y combos.', addr: 'R. Caetano Sampieri, 7-65', hours: 'Mar–dom 19:00–23:00 · Lunes cerrado' },
  { id: 'g-tayu', cat: 'restaurante', guia: true, name: 'Tayu · Gastronomía japonesa', lat: -22.356875, lon: -49.050242, rating: '4,5', reviews: 1283,
    addr: 'R. José Antônio Braga, 2-77', hours: 'Todos los días · Almuerzo 11:00–14:00 · Cena 18:00–23:00' },
  { id: 'g-camponesa', cat: 'restaurante', guia: true, name: 'Camponesa · O Parmegiana', lat: -22.369186, lon: -49.035717, rating: '4,6', reviews: 2855,
    info: 'Clásico plato italiano con toque brasileño.', addr: 'Av. Inácio Conceição Vieira, 14-45', hours: 'Todos los días 11:00–22:00 (vie y sáb hasta 23:00)' },
  { id: 'g-coisaboa', cat: 'restaurante', guia: true, name: 'Coisa Boa Gastronomia', lat: -22.334269, lon: -49.075238, rating: '4,6', reviews: 1092,
    info: 'Cocina brasileña del Chef Moa (programa "Mestre do Sabor").', addr: 'R. Monsenhor Claro, 12-64', hours: 'Todos los días 11:30–23:30' },
  { id: 'g-convivio', cat: 'restaurante', guia: true, psd: true, name: 'Convívio Restaurante', lat: -22.331039, lon: -49.059666, rating: '4,5', reviews: 320,
    info: 'Desde 1975: cerveza de barril, bocadillos y feijoada los sábados.', addr: 'Praça Antônio José Miziara', hours: 'Mar–vie 16:30–23:00 · Fines de semana 11:00–23:00 · Lunes cerrado' },

  { id: 'g-vr', cat: 'parque', guia: true, psd: true, name: 'Parque Vitória Régia', lat: -22.332148, lon: -49.058760, rating: '4,5', reviews: 10409,
    info: 'Lago con anfiteatro, ciclovía, juegos infantiles y baños públicos. Ideal para caminar.', addr: 'Av. Nações Unidas, 25-25', hours: 'Público · abierto 24 h' },
  { id: 'g-bosque', cat: 'parque', guia: true, psd: true, name: 'Bosque da Comunidade', lat: -22.336265, lon: -49.063815, rating: '4,6', reviews: 3368,
    info: 'Pista para caminar y gimnasio al aire libre.', addr: 'R. Araújo Leite, quadra 28', hours: 'Lun–vie 6:00–17:30 · Sáb y dom 7:00–17:30' },
  { id: 'g-horto', cat: 'parque', guia: true, name: 'Horto Florestal', lat: -22.315678, lon: -49.042337, rating: '4,7', reviews: 133,
    info: 'Entrada gratuita, áreas de picnic y actividades físicas.', addr: 'Av. Rodrigues Alves, 38-25', hours: 'Todos los días ~7:00–18:00' },
  { id: 'g-botanico', cat: 'parque', guia: true, name: 'Jardín Botánico de Bauru', lat: -22.343381, lon: -49.017288, rating: '4,8', reviews: 3693,
    info: 'Senderos accesibles con mirador y colecciones de plantas.', addr: 'Rod. Cmte. João Ribeiro de Barros, km 232', hours: 'Mar–dom 8:00–16:00 · Lunes cerrado' },
  { id: 'g-zoo', cat: 'parque', guia: true, name: 'Zoológico Municipal', lat: -22.341798, lon: -49.022108, rating: '4,7', reviews: 12455,
    info: 'Famoso por la reproducción de animales silvestres en peligro.', addr: 'Rod. Cmte. João Ribeiro de Barros, km 232', hours: 'Mar–vie 8:00–16:00 · Sáb, dom y feriados 8:00–17:00' },

  { id: 'g-boulevard', cat: 'shopping', guia: true, name: 'Boulevard Shopping', lat: -22.316484, lon: -49.066254, rating: '4,7', reviews: 28795,
    info: 'Tiendas, gastronomía, cine y servicios.', addr: 'R. Marcondes Salgado, 11-39', hours: 'Lun–sáb 10:00–22:00 · Dom y feriados 12:00–20:00' },
  { id: 'g-baurushopping', cat: 'shopping', guia: true, name: 'Bauru Shopping', lat: -22.341965, lon: -49.049806, rating: '4,6', reviews: 26031,
    info: 'Más de 230 tiendas, cine (Cine Araújo) y gimnasio.', addr: 'R. Henrique Savi, 15-55', hours: 'Lun–sáb 10:00–22:00 · Dom y feriados 12:00–20:00' },
  { id: 'g-calcadao', cat: 'shopping', guia: true, name: 'Calçadão Batista de Carvalho', lat: -22.323194, lon: -49.075852,
    info: 'Principal centro comercial al aire libre de Bauru.', addr: 'R. Batista de Carvalho · Centro', hours: 'Lun–sáb 9:00–18:00 · Domingo cerrado' },

  { id: 'g-pulse', cat: 'gimnasio', guia: true, name: 'Pulse Academia Nações', lat: -22.333993, lon: -49.055876, rating: '4,4', reviews: 161,
    info: 'Musculación, cardio, spinning, funcional y más.', addr: 'Av. Nações Unidas, 26-56', hours: 'Lun–vie 6:00–22:00 · Sáb y dom 9:00–12:00' },
  { id: 'g-kiakaha', cat: 'gimnasio', guia: true, name: 'Kia Kaha · CrossFit', lat: -22.330930, lon: -49.059683, rating: '4,9', reviews: 50,
    info: 'CrossFit, frente al Parque Vitória Régia.', addr: 'R. José Ferreira Marques, 4-36', hours: 'Lun–vie 6:00–22:00 · Sáb y dom 9:00–12:00' },
  { id: 'g-marathon', cat: 'gimnasio', guia: true, name: 'Marathon Wellness', lat: -22.321438, lon: -49.064779, rating: '4,7', reviews: 1137,
    info: 'Musculación, natación, danza y pilates.', addr: 'Av. Rodrigues Alves, quadra 15', hours: 'Lun–vie 6:00–23:59 · Sáb 8:00–15:00 · Dom 10:00–14:00' },
  { id: 'g-gavioes', cat: 'gimnasio', guia: true, name: 'Academia Gaviões 24 h', lat: -22.352316, lon: -49.050365, rating: '4,7', reviews: 311,
    info: 'Musculación, cardio, yoga y artes marciales.', addr: 'Av. Getúlio Vargas, 22-25', hours: '24 horas' },

  { id: 'g-bento', cat: 'bar', guia: true, name: 'Bento Bar', lat: -22.337071, lon: -49.064338, rating: '4,2', reviews: 125,
    info: 'Deck tranquilo + pista con DJ y shows en vivo.', addr: 'R. Sebastião Lins, 2-44', hours: 'Mié–jue 18:00–01:00 · Vie–sáb 18:00–02:00' },
  { id: 'g-loppen', cat: 'bar', guia: true, name: 'Loppen', lat: -22.347166, lon: -49.054802, rating: '4,7', reviews: 503,
    info: 'Discoteca y espacio gastronómico, enfoque LGBTQIA+.', addr: 'Av. Getúlio Vargas, quadra 17', hours: 'Vie y sáb 23:00–05:00' },
  { id: 'g-donamaria', cat: 'bar', guia: true, name: 'Dona Maria', lat: -22.342865, lon: -49.059589, rating: '4,6', reviews: 1650,
    info: 'Música en vivo y transmisiones deportivas.', addr: 'Av. Getúlio Vargas, 10-130', hours: 'Mar–jue 18:00–00:00 · Vie–sáb 18:00–01:00 · Dom 16:00–22:30' },
  { id: 'g-aeroclube', cat: 'bar', guia: true, name: 'Bar Aeroclube', lat: -22.343374, lon: -49.053818, rating: '4,6', reviews: 2215,
    info: 'Restaurante al mediodía, bar y petisquería por la noche.', addr: 'Al. Dr. Octávio Pinheiro Brisolla, 19-100', hours: 'Lun–jue 10:00–23:00 · Vie–sáb 10:00–00:00 · Dom 10:00–20:00' },
  { id: 'g-voodoo', cat: 'bar', guia: true, name: 'Voodoo Lounge Pub', lat: -22.339638, lon: -49.061565, rating: '4,7', reviews: 575,
    info: 'El karaoke más famoso de Bauru.', addr: 'R. Antônio Alves, 34-61', hours: 'Mié–sáb desde 18:00 hasta ~02:00' },
  { id: 'g-bendito', cat: 'bar', guia: true, name: 'Bendito Santo Botequim', lat: -22.354841, lon: -49.048945, rating: '4,6', reviews: 1187,
    info: 'Para ir en grupo con amigos.', addr: 'Av. Getúlio Vargas, 23-98', hours: 'Mar–jue 17:30–00:00 · Vie–sáb hasta 01:00 · Dom 15:30–22:00' },
  { id: 'g-gostoso', cat: 'bar', guia: true, name: 'Gostoso Botequim', lat: -22.340405, lon: -49.060666, rating: '4,4', reviews: 275,
    info: 'Tradición carioca con modernidad paulista.', addr: 'R. Ignácio Alexandre Nasralla, 6-15', hours: 'Mar–jue 17:00–23:30 · Vie hasta 00:00 · Sáb 12:00–00:00 · Dom 12:00–22:00' },
  { id: 'g-une', cat: 'bar', guia: true, name: 'Üne Bar', lat: -22.342836, lon: -49.059637, rating: '4,2', reviews: 55,
    info: 'Vibe "previa": el primer destino de la noche.', addr: 'Av. Getúlio Vargas, 10-120', hours: 'Mié–jue 18:00–23:00 · Vie hasta 00:00 · Sáb–dom 15:00–00:00' },
];

// Pines del PSD del episodio identificados en Google Maps (los que no están en google-places.tsv)
export const PSD_EXTRA = [
  { id: 'psd-maxdog', cat: 'restaurante', psd: true, name: 'Max Dog Hot Dogs & Burguers', lat: -22.330329, lon: -49.063026, rating: '2,6', reviews: 28,
    info: 'Hot dogs y hamburguesas.', addr: 'R. Ver. Joaquim da Silva Martha, 20-33' },
  { id: 'psd-essencia', cat: 'restaurante', psd: true, name: 'Restaurante Essência Oriental', lat: -22.33046, lon: -49.06297, info: 'Vegetariano / oriental.' },
  { id: 'psd-molhin', cat: 'restaurante', psd: true, name: 'Molhin de Filé · Comida Afetiva', lat: -22.33103, lon: -49.06318, info: 'Comida casera.' },
];

export const EXTRAS = [
  { id: 'restaurante-15', cat: 'restaurante', name: 'Restaurante 15', lat: -22.3295391, lon: -49.0628007, rating: '4,7', reviews: 328,
    info: 'Self-service (comida por kilo) · R$ 40–60.', addr: 'R. Padre João, 16-80 · Vila Santa Teresa', tel: '(14) 3223-0348',
    hours: 'Lun–sáb 7:30–14:10 · Domingo cerrado' },
  { id: 'rodoviaria', cat: 'transporte', name: 'Terminal Rodoviária de Bauru', lat: -22.312635, lon: -49.068604,
    info: 'Aquí llegan los autobuses desde São Paulo (Barra Funda), ~5 h de viaje.' },
];
