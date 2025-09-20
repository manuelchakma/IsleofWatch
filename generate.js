const fs = require("fs-extra");
const OUTPUT_DIR = "site";
fs.ensureDirSync(OUTPUT_DIR);

const indexHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>IsleofWatch</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.3.2/dist/tailwind.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/glidejs/3.5.2/css/glide.core.min.css"/>
<style>
body { background:#0f0f0f; color:#fff; font-family:'Arial',sans-serif; margin:0; }
header { padding:20px; text-align:center; background:#111; }
#search { width:60%; padding:10px; border-radius:5px; border:none; outline:none; }
.glide__slide img { width:100%; border-radius:10px; height:400px; object-fit:cover; cursor:pointer; }
h2 { padding-left:20px; font-size:1.5rem; margin-top:20px; }
.grid { display:flex; overflow-x:auto; gap:15px; padding:20px; }
.card { min-width:200px; background:#222; border-radius:10px; cursor:pointer; transition:transform 0.3s; flex-shrink:0; position:relative; }
.card:hover { transform:scale(1.05); }
.card img { width:100%; border-radius:10px 10px 0 0; }
.card h3 { padding:10px; font-size:1rem; text-align:center; }
.card .play-icon { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-size:50px; color:#fff; display:none; pointer-events:none; }
.card:hover .play-icon { display:block; }
.modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); justify-content:center; align-items:center; z-index:1000; }
.modal iframe { width:80%; height:80%; border:none; border-radius:10px; }
.close { position:absolute; top:20px; right:30px; font-size:30px; cursor:pointer; color:#fff; }
</style>
</head>
<body>

<header>
  <h1 class="text-3xl font-bold">IsleofWatch</h1>
  <input id="search" type="text" placeholder="Search movies, anime, TV series..." />
</header>

<div class="glide" id="featuredSlider" style="padding:20px 0;">
  <div class="glide__track" data-glide-el="track">
    <ul class="glide__slides" id="featuredSlides"></ul>
  </div>
</div>

<div id="content"></div>

<div class="modal" id="modal">
  <span class="close" id="closeBtn">&times;</span>
  <iframe id="player" allowfullscreen></iframe>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/glidejs/3.5.2/glide.min.js"></script>
<script>
const modal = document.getElementById('modal');
const player = document.getElementById('player');
const closeBtn = document.getElementById('closeBtn');
const searchInput = document.getElementById('search');
const contentDiv = document.getElementById('content');
const featuredSlides = document.getElementById('featuredSlides');

const categories = {
  "Movies": "LatestMovies2025",
  "Anime": "LatestAnime2025",
  "TV Series": "LatestTV2025"
};

async function loadLatest() {
  contentDiv.innerHTML = '';
  featuredSlides.innerHTML = '';

  for (const [category, collection] of Object.entries(categories)) {
    const sectionEl = document.createElement('section');
    sectionEl.innerHTML = \`<h2>\${category}</h2>\`;
    const grid = document.createElement('div');
    grid.className = 'grid';
    
    const url = \`https://archive.org/advancedsearch.php?q=collection:\${collection}&fl[]=identifier,title,downloads&rows=50&page=1&output=json\`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      const items = data.response.docs || [];

      items.forEach((m, idx) => {
        const fileKey = Object.keys(m.downloads || {})[0] || '';
        if (!fileKey) return;
        const videoUrl = \`https://archive.org/embed/\${m.identifier}\`;
        const thumb = \`https://archive.org/services/img/\${m.identifier}\`;

        if (category === "Movies" && idx < 5) {
          const slide = document.createElement('li');
          slide.className = 'glide__slide';
          slide.innerHTML = \`<img src="\${thumb}" alt="\${m.title}" title="\${m.title}">\`;
          slide.onclick = () => { player.src = videoUrl; modal.style.display='flex'; };
          featuredSlides.appendChild(slide);
        }

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = \`
          <img src="\${thumb}" alt="\${m.title}">
          <div class="play-icon">&#9658;</div>
          <h3>\${m.title}</h3>
        \`;
        card.onclick = () => { player.src = videoUrl; modal.style.display='flex'; };
        grid.appendChild(card);
      });

    } catch (err) {
      console.error('Error fetching collection', collection, err);
    }

    sectionEl.appendChild(grid);
    contentDiv.appendChild(sectionEl);
  }

  new Glide('#featuredSlider', { type:'carousel', autoplay:5000, hoverpause:true }).mount();
}

closeBtn.onclick = () => { player.src=''; modal.style.display='none'; };

searchInput.addEventListener('keyup', () => {
  const query = searchInput.value.toLowerCase();
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    const title = card.querySelector('h3').textContent.toLowerCase();
    card.style.display = title.includes(query) ? '' : 'none';
  });
});

loadLatest();
</script>
</body>
</html>
`;

fs.writeFileSync(`${OUTPUT_DIR}/index.html`, indexHTML, "utf-8");
console.log("✅ IsleofWatch modern site generated!");
