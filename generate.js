<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>IsleofWatch</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin:0; font-family: Arial, sans-serif; background:#111; color:#fff; }
    header { padding:20px; text-align:center; background:#222; }
    input#search { width:60%; padding:10px; font-size:16px; border-radius:4px; border:none; }
    #results { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:15px; padding:20px; }
    .card { background:#222; padding:10px; border-radius:6px; cursor:pointer; transition: transform .2s; }
    .card:hover { transform: scale(1.05); }
    .card img { width:100%; border-radius:4px; }
    .card h3 { font-size:16px; margin:10px 0 0; }
    .modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); justify-content:center; align-items:center; z-index:1000; }
    .modal video { width:80%; height:auto; }
    .modal .close { position:absolute; top:20px; right:30px; font-size:30px; cursor:pointer; color:#fff; }
  </style>
</head>
<body>
  <header>
    <h1>IsleofWatch</h1>
    <input type="text" id="search" placeholder="Search for movies or series...">
  </header>
  <div id="results"></div>
  <div class="modal" id="modal">
    <span class="close" id="closeBtn">&times;</span>
    <video id="player" controls></video>
  </div>

  <script>
    const searchInput = document.getElementById('search');
    const resultsDiv = document.getElementById('results');
    const modal = document.getElementById('modal');
    const player = document.getElementById('player');
    const closeBtn = document.getElementById('closeBtn');

    async function searchMovies(query) {
      resultsDiv.innerHTML = '<p style="text-align:center">Loading...</p>';
      try {
        const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)} AND mediatype:(movies)&fl[]=identifier,title&rows=20&page=1&output=json`;
        const res = await fetch(url);
        const data = await res.json();
        const movies = data.response.docs || [];
        if (!movies.length) {
          resultsDiv.innerHTML = '<p style="text-align:center">No results found.</p>';
          return;
        }
        renderResults(movies);
      } catch (err) {
        resultsDiv.innerHTML = '<p style="text-align:center">Error fetching data.</p>';
        console.error(err);
      }
    }

    async function renderResults(movies) {
      resultsDiv.innerHTML = '';
      for (const m of movies) {
        try {
          const metaUrl = `https://archive.org/metadata/${m.identifier}`;
          const metaRes = await fetch(metaUrl);
          const meta = await metaRes.json();
          const files = meta.files || [];
          const videoFile = files.find(f => f.format && f.format.toLowerCase().includes('mp4'));
          if (!videoFile) continue;

          const videoUrl = `https://archive.org/download/${m.identifier}/${videoFile.name}`;
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = `
            <img src="https://archive.org/services/img/${m.identifier}" alt="${m.title}">
            <h3>${m.title}</h3>
          `;
          card.onclick = () => {
            player.src = videoUrl;
            modal.style.display = 'flex';
            player.play();
          };
          resultsDiv.appendChild(card);
        } catch (err) {
          console.error('Error loading metadata for', m.identifier, err);
        }
      }
    }

    searchInput.addEventListener('keyup', e => {
      if(e.key === 'Enter') searchMovies(searchInput.value);
    });

    closeBtn.onclick = () => {
      player.pause();
      modal.style.display = 'none';
    };
  </script>
</body>
</html>
