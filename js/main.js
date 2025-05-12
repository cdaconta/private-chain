(function () {
    const DB_NAME = 'MyAppDB';
    const DB_VERSION = 3;
    const STORE_NAME = 'items';
    let db = null;

    async function openDatabase() {
      if (db) return db;
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = e => {
          const database = e.target.result;
          if (!database.objectStoreNames.contains(STORE_NAME)) {
            database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          }
        };
        req.onsuccess = e => resolve(db = e.target.result);
        req.onerror = e => reject(new Error('DB open failed: ' + e.target.error));
      });
    }

    async function addItem(item) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      return new Promise((res, rej) => {
        const r = store.add(item);
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    }

    async function getAllItems() {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      return new Promise((res, rej) => {
        const r = store.getAll();
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    }

    const feedbackEl = document.getElementById('feedback');

    function clearFeedback() {
      feedbackEl.innerHTML = '';
    }

    function showItems(items) {
      clearFeedback();
      if (items.length === 0) {
        feedbackEl.innerHTML = '<li class="list-group-item">No items found.</li>';
        return;
      }
      items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `<strong>${item.name}</strong> — ${item.description || '(no desc)'}<br>
          <small>🆔 ${item.id} @ ${new Date(item.created).toLocaleString()}</small>`;

        if (item.image) {
          const img = document.createElement('img');
          img.src = item.image;
          img.alt = "Image";
          img.className = "img-fluid mt-2";
          li.appendChild(img);
        }
        if (item.video) {
          const video = document.createElement('video');
          video.src = item.video;
          video.controls = true;
          video.className = "w-100 mt-2";
          li.appendChild(video);
        }
        if (item.audio) {
          const audio = document.createElement('audio');
          audio.src = item.audio;
          audio.controls = true;
          audio.className = "w-100 mt-2";
          li.appendChild(audio);
        }
        if (item.drawing) {
  const drawingImg = document.createElement('img');
  drawingImg.src = item.drawing;
  drawingImg.alt = "Drawing";
  drawingImg.className = "img-fluid mt-2";
  li.appendChild(drawingImg);
}

        feedbackEl.appendChild(li);
      });
    }

    function showError(msg) {
      clearFeedback();
      const li = document.createElement('li');
      li.className = 'list-group-item text-danger';
      li.textContent = 'Error: ' + msg;
      feedbackEl.appendChild(li);
    }

    async function handleFormSubmit(evt) {
      evt.preventDefault();
      const form = evt.target;
      const name = form.name.value.trim();
      const desc = form.description.value.trim();
      if (!name) return showError('Item name is required.');

      const readFile = input => new Promise(resolve => {
        const file = input.files[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(file);
      });

      const image = await readFile(form.image);
      const video = await readFile(form.video);
      const audio = await readFile(form.audio);
      const drawing = form.drawing.value || null;



      try {
        await addItem({ name, description: desc, created: Date.now(), image, video, audio, drawing });
        form.reset();
        showItems(await getAllItems());
      } catch (err) {
        showError(err.message);
        console.error(err);
      }
    }

    function toggleDrawer() {
      const d = document.getElementById('drawer');
      const open = d.classList.toggle('open');
      d.setAttribute('aria-hidden', !open);
    }

    function closeDrawer() {
      const d = document.getElementById('drawer');
      d.classList.remove('open');
      d.setAttribute('aria-hidden', 'true');
    }
// Drawing canvas logic
function setupCanvas(canvasId, clearBtnId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  let drawing = false;

  const start = e => {
    drawing = true;
    ctx.beginPath();
    const rect = drawingCanvas.getBoundingClientRect();
ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);

  };

  const draw = e => {
    if (!drawing) return;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);

    ctx.stroke();
  };

  const end = () => {
    drawing = false;
    ctx.closePath();
  };

  // Mouse events
  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", end);
  canvas.addEventListener("mouseout", end);

  // Touch events (for stylus support)
  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    drawing = true;
  });

  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  });

  canvas.addEventListener("touchend", e => {
    e.preventDefault();
    drawing = false;
  });

  // Clear button
  document.getElementById(clearBtnId).addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  return canvas;
}
let drawingCanvas, ctx;

function setupDrawingModal() {
  drawingCanvas = document.getElementById('drawingCanvas');
  ctx = drawingCanvas.getContext("2d");
  ctx.lineWidth = 2;

  let drawing = false;

  const startDraw = e => {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  };

  const draw = e => {
    if (!drawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  };

  const endDraw = () => {
    drawing = false;
    ctx.closePath();
  };

  drawingCanvas.addEventListener("mousedown", startDraw);
  drawingCanvas.addEventListener("mousemove", draw);
  drawingCanvas.addEventListener("mouseup", endDraw);
  drawingCanvas.addEventListener("mouseout", endDraw);

  document.getElementById('clearCanvas').addEventListener('click', () => {
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  });

  document.getElementById('saveDrawing').addEventListener('click', () => {
    const data = drawingCanvas.toDataURL();
    document.getElementById('drawingData').value = data;
  });
}

    document.addEventListener('DOMContentLoaded', async () => {
      try {
        await openDatabase();
        showItems(await getAllItems());
      } catch (err) {
        showError(err.message);
      }

      document.getElementById('itemForm').addEventListener('submit', handleFormSubmit);
      document.getElementById('toggleDrawer').addEventListener('click', toggleDrawer);
      document.getElementById('closeDrawer').addEventListener('click', closeDrawer);
      setupDrawingModal();
document.getElementById('openDrawingModal').addEventListener('click', () => {
  const modal = new bootstrap.Modal(document.getElementById('drawingModal'));
  modal.show();
});

    });
  })();