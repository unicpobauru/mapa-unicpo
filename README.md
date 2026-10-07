# Mapa · Todo cerca de UniCPO

Site mobile do episódio "Coisas perto da UniCPO" do quadro *Manual de Supervivencia del Extranjero en Brasil*.

## Estrutura

- `index.html`, `styles.css`, `app.js`: o site (HTML/CSS/JS puro, sem build)
- `config.js`: **cole aqui a API key do Google Maps**. Se ficar vazio, o mapa usa OpenStreetMap
- `img/hospedaje/`: fotos dos hotéis e Airbnbs, recortadas do PDF "Etapas y Trámites del Viaje 2.0"
- `data/curated.mjs`: hotéis, Airbnbs da Tânia, lugares do guia "¿Qué hacer en Bauru?" e pins do PSD (editar aqui)
- `data/google-places.tsv`: farmácias, bares, restaurantes etc. levantados no Google Maps (out/2026)
- `data/psd-pins.json`: pins do `mapa.psd` convertidos em latitude/longitude
- `data/places.js`: **gerado**. Depois de editar os dados, rode `node data/build.mjs`

## Link direto para um lugar

`.../mapa-unicpo/#hotel-alfa` abre a ficha do hotel (o id fica em `data/curated.mjs`).

## Google Maps API key

1. No Google Cloud Console, crie um projeto e ative a **Maps JavaScript API** (precisa de faturamento ativo; o uso deste site cabe na cota gratuita mensal).
2. Crie uma API key e restrinja em *Application restrictions → Websites* para `https://unicpobauru.github.io/*`.
3. Cole a key em `config.js`.
