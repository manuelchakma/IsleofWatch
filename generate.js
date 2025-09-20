const fs = require('fs-extra');

const OUTPUT_DIR = 'site';
fs.ensureDirSync(OUTPUT_DIR);

const indexHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>IsleofWatch</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { margin:0; font-family: Arial, sans-serif; background:#111; color:#fff; }
header { padding:20px; text-align:center; background:#222; position:sticky; top:0; z-index:10; }
header h1 { margin:0; }
input#search { width:60%; padding:10px; font-size:16px; border-radius:4px; border:none; margin-top:10px; }
#trending { padding:20px; }
#trending h2 { margin-bottom:15px; }
#results, #trending-list { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:15px; }
.card { background:#222; padding:10px; border-radius:6px; cursor:pointer; transition: transform .2s, box-shadow .2s; }
.card:hover { transform: scale(1.05); box-shadow:0 0 15px #fff; }
.card img { width:100%; border-radius:4px; }
.card h3 { font-size:14px; margin-top:8px; text-align:center; }
.modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); justify-content:center; align-items:center; z-index:1000; }
.modal video { width:80%; max-height:80%; }
.modal .close { position:absolute; top:20px; right:30px; font-size:30px; cursor:pointer; color:#fff; }
</style>
</head>
<body>
<header>
<h1>IsleofWatch</h1>
<input type="text" id="search" placeholder="Search for movies or series...">
</header>

<section id="trending">
<h2>Trending Movies</h2>
<div id="trending-list"></div>
</section>

<div id="results"></div>

<div class="modal" id="modal">
  <span class="close" id="closeBtn">&times;</span>
  <video id="player" controls></video>
</div>

<script>
const searchInput = document.getElementById('search');
const resultsDiv = document.getElementById('results');
const trendingDiv = document.getElementById('trending-list');
const modal = document.getElementById('modal');
const player = document.getElementById('player');
const closeBtn = document.getElementById('closeBtn');

// Trending movies - known public IA movies
const trendingMovies = [
  {identifier:'the-last-hunter-1980-film', title:'The Last Hunter'},
  {identifier:'alien-1979', title:'Alien'},
  {identifier:'plan-9-from-outer-space-1959', title:'Plan 9 from Outer Space'},
  {identifier:'night-of-the-living-dead-1968', title:'Night of the Living Dead'}
];

// Fetch metadata and pick first playable file dynamically
async function renderTrending() {
  trendingDiv.innerHTML = '';

  trendingMovies.forEach(async (m) => {
    try {
      const url = \`https://archive.org/metadata/\${m.identifier}\`;
      const res = await fetch(url);
      const data = await res.json();
      const files = data.files || [];
      const playable = files.find(f => f.name && (f.name.endsWith('.mp4') || f.name.endsWith('.ogv')));
      if (!playable) return;

      const videoUrl = \`https://archive.org/download/\${m.identifier}/\${playable.name}\`;

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = \`
        <img src="https://archive.org/services/img/\${m.identifier}" alt="\${m.title}">
        <h3>\${m.title}</h3>
      \`;
      card.onclick = () => {
        player.src = videoUrl;
        modal.style.display = 'flex';
        player.play();
      };
      trendingDiv.appendChild(card);

    } catch (err) {
      console.error(\`Failed to load trending movie: \${m.identifier}\`, err);
    }
  });
}

async function searchMovies(query) {
  resultsDiv.innerHTML = '<p style="text-align:center">Loading...</p>';
  try {
    const url = \`https://archive.org/advancedsearch.php?q=\${encodeURIComponent(query)}&fl[]=identifier,title,files&rows=50&page=1&output=json\`;
    const res = await fetch(url);
    const data = await res.json();
    const movies = data.response.docs || [];
    renderResults(movies);
  } catch (err) {
    resultsDiv.innerHTML = '<p style="text-align:center">Error fetching data.</p>';
    console.error(err);
  }
}

function renderResults(movies) {
  resultsDiv.innerHTML = '';

  movies.forEach(m => {
    if (!m.files) return;
    const playable = m.files.find(f => f.name && (f.name.endsWith('.mp4') || f.name.endsWith('.ogv')));
    if (!playable) return;

    const videoUrl = \`https://archive.org/download/\${m.identifier}/\${playable.name}\`;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = \`
      <img src="https://archive.org/services/img/\${m.identifier}" alt="\${m.title}">
      <h3>\${m.title}</h3>
    \`;
    card.onclick = () => {
      player.src = videoUrl;
      modal.style.display = 'flex';
      player.play();
    };
    resultsDiv.appendChild(card);
  });

  if (resultsDiv.children.length === 0) {
    resultsDiv.innerHTML = '<p style="text-align:center">No results found.</p>';
  }
}

searchInput.addEventListener('keyup', e => {
  if (e.key === 'Enter' && searchInput.value.trim() !== '') {
    searchMovies(searchInput.value.trim());
  }
});

closeBtn.onclick = () => {
  player.pause();
  modal.style.display = 'none';
};

// Render trending on page load
renderTrending();
</script>
</body>
</html>
`;

fs.writeFileSync(`${OUTPUT_DIR}/index.html`, indexHTML, 'utf-8');
