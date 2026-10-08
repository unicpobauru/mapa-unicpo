# Mapa · Todo cerca de UniCPO

Site mobile do episódio "Coisas perto da UniCPO" do quadro *Manual de Supervivencia del Extranjero en Brasil*.
No ar em https://unicpobauru.github.io/mapa-unicpo/

## Estrutura

- `index.html`, `styles.css`, `app.js`: o site (HTML/CSS/JS puro, sem build)
- `community.js`: nota dos alunos UniCPO (votação) e reportes de suporte
- `backend/`: script da Planilha Google que guarda votos e reportes. **Instalação em [backend/README.md](backend/README.md)**
- `config.js`: `apiUrl` (URL do backend) e `googleMapsApiKey` (opcional; vazio = OpenStreetMap)
- `img/hospedaje/`: fotos dos hotéis e Airbnbs, recortadas do PDF "Etapas y Trámites del Viaje 2.0"
- `data/curated.mjs`: hotéis, Airbnbs da Tânia, lugares do guia "¿Qué hacer en Bauru?" e pins do PSD (editar aqui)
- `data/google-places.tsv`: farmácias, bares, restaurantes etc. levantados no Google Maps (out/2026)
- `data/instagram.json`: @ do Instagram de cada lugar (`"id-do-lugar": "usuario"`, sem @)
- `data/psd-pins.json`: pins do `mapa.psd` convertidos em latitude/longitude
- `data/places.js`: **gerado**. Depois de editar os dados, rode `node data/build.mjs`

O id de cada lugar (ex.: `bar-da-rosa-n8bz`) vem do nome + coordenada e é a chave dos votos na planilha.
Não mude o nome ou a coordenada de um lugar que já tem votos sem avisar, senão os votos ficam "órfãos".

## Link direto para um lugar

`.../mapa-unicpo/#hotel-alfa` abre a ficha do hotel. Com `?demo` (ex.: `.../mapa-unicpo/?demo#restaurante-15`)
dá para testar a votação e os reportes sem backend: fica tudo só no seu navegador.

## Google Maps API key (opcional)

1. No Google Cloud Console, crie um projeto e ative a **Maps JavaScript API** (precisa de faturamento ativo; o uso deste site cabe na cota gratuita mensal).
2. Crie uma API key e restrinja em *Application restrictions → Websites* para `https://unicpobauru.github.io/*`.
3. Cole a key em `config.js`.

## Publicar uma atualização

Depois de mudar qualquer arquivo, aumente o número `?v=` no `index.html` (ex.: `?v=6` → `?v=7`) para os celulares não usarem a versão antiga do cache.
