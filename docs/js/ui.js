// ui.js

import state from "./variables.js";
import { savePlaylists, updateQueueIndex } from "./saveInfo.js";
import { showTemporaryNotification } from "./helper.js";
import { playSong } from "./app.js"; 

const queueModalBody = document.getElementById("queueModalBody");
const playlistModalBody = document.getElementById("playlistModalBody");
const playlistOpt = document.getElementById("playlistOpt");

export let currentSongRef = null;
export function setCurrentSongRef(songObj) {
  currentSongRef = songObj;
}

export function populateQueueUI() {
  queueModalBody.innerHTML = "";

  if (state.songQueue.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "modal-empty";
    emptyState.textContent = "Queue is empty. Add songs from the map!";
    queueModalBody.appendChild(emptyState);
    return;
  }

  state.songQueue.forEach((song, i) => {
    const el = document.createElement("div");
    el.className = i === state.songIndex ? "queue-item current" : "queue-item";
    el.textContent = `${song.artist} — ${song.title}`;

    el.addEventListener("click", () => {
      state.songIndex = i;
      playSong(song.url, song.title, song.artist);

      populateQueueUI();
      updateQueueIndex();
    });

    queueModalBody.appendChild(el);
  });
}

export function populatePlaylistsUI() {
  const container = playlistModalBody;
  const optContainer = playlistOpt;

  container.innerHTML = "";
  optContainer.innerHTML = `
    <button id="createPlaylistBtn" class="menu-item">Create New Playlist</button>
  `;

  bindCreatePlaylistBtn();

  if (Object.keys(state.playlists).length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "modal-empty";
    emptyState.textContent = "No playlists yet. Create your first one!";
    container.appendChild(emptyState);
  }

  for (const [name, songs] of Object.entries(state.playlists)) {
    const dropdown = document.createElement("div");
    dropdown.className = "dropdown";

    const btn = document.createElement("button");
    btn.className = "dropdown-btn";

    const btnContent = document.createElement("span");
    btnContent.textContent = name;

    const countBadge = document.createElement("span");
    countBadge.textContent = "";
    btn.appendChild(btnContent);
    btn.appendChild(countBadge);

    const content = document.createElement("div");
    content.className = "dropdown-content";

    if (songs.length === 0) {
      const empty = document.createElement("button");
      empty.className = "song-btn";
      empty.textContent = "No songs in this playlist";
      empty.style.color = "rgba(255,255,255,.4)";
      empty.style.cursor = "default";
      content.appendChild(empty);
    } else {
      songs.forEach(s => {
        const sbtn = document.createElement("button");
        sbtn.className = "song-btn";
        sbtn.textContent = `${s.artist} — ${s.title}`;
        sbtn.onclick = () => {
          playSong(s.url, s.title, s.artist);
        };
        content.appendChild(sbtn);
      });
    }

    dropdown.appendChild(btn);
    dropdown.appendChild(content);
    container.appendChild(dropdown);

    // quick add item
    const optBtn = document.createElement("button");
    optBtn.className = "menu-item";

    const optText = document.createElement("span");
    optText.textContent = name;

    const optCount = document.createElement("span");
    optCount.textContent = songs.length;
    optCount.style.background = "rgba(255,255,255,.2)";
    optCount.style.padding = "2px 6px";
    optCount.style.borderRadius = "8px";
    optCount.style.fontSize = "0.7em";

    optBtn.appendChild(optText);
    optBtn.appendChild(optCount);

    optBtn.onclick = () => {
      if (!currentSongRef) {
        showTemporaryNotification("No song playing!");
        return;
      }

      if (state.playlists[name].find(s => s.url === currentSongRef.url)) {
        showTemporaryNotification("Song already in playlist!");
        return;
      }

      state.playlists[name].push({ ...currentSongRef });

      if (content.querySelector('.song-btn[style*="rgba(255,255,255,.4)"]')) {
        content.innerHTML = "";
      }

      const newBtn = document.createElement("button");
      newBtn.className = "song-btn";
      newBtn.textContent = `${currentSongRef.artist} — ${currentSongRef.title}`;
      newBtn.onclick = () => {
        playSong(currentSongRef.url, currentSongRef.title, currentSongRef.artist);
      };
      content.appendChild(newBtn);

      optCount.textContent = state.playlists[name].length;

      savePlaylists();
      showTemporaryNotification(`Added to "${name}"`);
    };

    optContainer.appendChild(optBtn);

    btn.onclick = e => {
      e.stopPropagation();
      container.querySelectorAll(".dropdown").forEach(d => d.classList.remove("active"));
      dropdown.classList.toggle("active");
    };
  }
}

export function bindCreatePlaylistBtn() {
  const btn = document.getElementById("createPlaylistBtn");
  if (!btn) return;

  btn.onclick = () => {
    if (!currentSongRef) {
      showTemporaryNotification("Play a song first!");
      return;
    }

    const name = prompt("Playlist name:");
    if (!name) return;

    state.playlists[name] = [currentSongRef];

    populatePlaylistsUI();
    savePlaylists();

    showTemporaryNotification(`"${name}" created`);
  };
}
