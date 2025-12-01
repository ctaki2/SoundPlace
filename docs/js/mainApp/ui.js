// ui.js

import state from "./variables.js";
import { savePlaylists, updateQueueIndex, saveQueue, saveManualQueue } from "./saveInfo.js";
import { showTemporaryNotification } from "./helper.js";
import { playSong } from "./app.js"; 

const queueModalBody = document.getElementById("queueModalBody");
const historyModalBody = document.getElementById("historyModalBody");
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

// bind clear queue button
const clearQueueBtn = document.getElementById('clearQueueBtn');
if (clearQueueBtn) {
  clearQueueBtn.addEventListener('click', () => {
    if (!confirm('Clear the entire queue?')) return;
    state.songQueue = [];
    state.songIndex = -1;
    // reset manual queue counter when user clears the queue
    state.ManualQueue = 0;
    populateQueueUI();
    try {
      saveQueue();
      saveManualQueue();
    } catch (e) {}
    showTemporaryNotification('Queue cleared');
  });
}

export function populateHistoryUI() {
  historyModalBody.innerHTML = ""

  if (state.history.length == 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "modal-empty";
    emptyState.textContent = "No History";
    historyModalBody.appendChild(emptyState)
    return;
  }

  state.history.forEach((song,i) => {
    const el = document.createElement("div");
    el.className = i === state.songIndex ? "history-item current" : "history-item";
    el.textContent = `${song.artist} — ${song.title}`;
    
    el.addEventListener("click", () => {
      // state.songIndex = i;
      playSong(song.url, song.title, song.artist);

      populateHistoryUI();
      // updateQueueIndex();
    })

    historyModalBody.appendChild(el)
  });

}

export function populatePlaylistsUI() {
  const container = playlistModalBody;
  const optContainer = playlistOpt;

  container.innerHTML = "";
  optContainer.innerHTML = `
    <button id="createPlaylistBtn" class="menu-item">New</button>
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

    // header container — use div to avoid nesting interactive controls
    const btn = document.createElement("div");
    btn.className = "dropdown-btn";
    btn.setAttribute('role', 'button');
    btn.tabIndex = 0;

    const btnContent = document.createElement("span");
    btnContent.textContent = name;

    // create header delete icon (placed left of the title)
    const headerDelete = document.createElement('button');
    headerDelete.className = 'playlist-delete-inline';
    headerDelete.setAttribute('aria-label', `Delete playlist ${name}`);
    headerDelete.title = 'Delete playlist';
    headerDelete.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    `;
    headerDelete.onclick = (ev) => {
      ev.stopPropagation();
      if (!confirm(`Delete playlist \"${name}\"? This cannot be undone.`)) return;
      delete state.playlists[name];
      populatePlaylistsUI();
      try { savePlaylists(); } catch (e) {}
      showTemporaryNotification(`Deleted playlist \"${name}\"`);
    };

    btn.appendChild(headerDelete);
    btn.appendChild(btnContent);

    const content = document.createElement("div");
    content.className = "dropdown-content";

    if (songs.length === 0) {
      const empty = document.createElement("div");
      empty.className = "modal-empty";
      empty.textContent = "No songs in this playlist";
      content.appendChild(empty);
    } else {
      songs.forEach((s, si) => {
        const row = document.createElement('div');
        row.className = 'playlist-song-row';

        const sbtn = document.createElement("button");
        sbtn.className = "song-btn";
        sbtn.textContent = `${s.artist} — ${s.title}`;
        sbtn.onclick = () => { playSong(s.url, s.title, s.artist); };

        const removeBtn = document.createElement('button');
        removeBtn.className = 'song-remove-btn';
        removeBtn.title = 'Remove from playlist';
        removeBtn.setAttribute('aria-label', `Remove ${s.title}`);
        removeBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        `;
        removeBtn.onclick = (ev) => {
          ev.stopPropagation();
          if (!confirm(`Remove "${s.title}" from \"${name}\"?`)) return;
          const idx = state.playlists[name].findIndex(x => x.url === s.url);
          if (idx !== -1) state.playlists[name].splice(idx, 1);
          row.remove();
          try { savePlaylists(); } catch (e) {}
          showTemporaryNotification(`Removed from "${name}"`);
        };

        row.appendChild(sbtn);
        row.appendChild(removeBtn);
        content.appendChild(row);
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

    optBtn.appendChild(optText);

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
      // Clear empty state if it exists
      if (content.querySelector('.modal-empty')) { content.innerHTML = ''; }

      // Add new song row to dropdown content (match existing row structure)
      const newRow = document.createElement('div');
      newRow.className = 'playlist-song-row';

      const newSbtn = document.createElement('button');
      newSbtn.className = 'song-btn';
      newSbtn.textContent = `${currentSongRef.artist} — ${currentSongRef.title}`;
      newSbtn.onclick = () => { playSong(currentSongRef.url, currentSongRef.title, currentSongRef.artist); };

      const newRemove = document.createElement('button');
      newRemove.className = 'song-remove-btn';
      newRemove.title = 'Remove from playlist';
      newRemove.setAttribute('aria-label', `Remove ${currentSongRef.title}`);
      newRemove.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      `;
      newRemove.onclick = (ev) => {
        ev.stopPropagation();
          // place remove icon first so it appears on the left
          newRow.appendChild(newRemove);
          newRow.appendChild(newSbtn);
        if (idx !== -1) state.playlists[name].splice(idx, 1);
        newRow.remove();
        try { savePlaylists(); } catch (e) {}
        showTemporaryNotification(`Removed from "${name}"`);
      };

      newRow.appendChild(newSbtn);
      newRow.appendChild(newRemove);
      content.appendChild(newRow);

      savePlaylists();
      showTemporaryNotification(`Added to "${name}"`);
    };

    optContainer.appendChild(optBtn);

    // toggle dropdown on click/keyboard
    const toggleDropdown = (e) => {
      if (e) e.stopPropagation();
      const isActive = dropdown.classList.contains('active');
      container.querySelectorAll(".dropdown").forEach(d => d.classList.remove("active"));
      if (!isActive) dropdown.classList.add('active');
    };
    btn.addEventListener('click', toggleDropdown);
    btn.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggleDropdown(ev); } });
  }
}

export function bindCreatePlaylistBtn() {
  const btn = document.getElementById("createPlaylistBtn");
  if (!btn) return;

  btn.onclick = () => {
    const name = prompt("Playlist name:");
    if (!name) return;

    // If there's a current song, add it to the new playlist; otherwise create empty playlist
    if (currentSongRef) {
      state.playlists[name] = [ { ...currentSongRef } ];
    } else {
      state.playlists[name] = [];
    }

    populatePlaylistsUI();
    try { savePlaylists(); } catch (e) {}

    showTemporaryNotification(`"${name}" created`);
  };
}
