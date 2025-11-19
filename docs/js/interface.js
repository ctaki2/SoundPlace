// interface.js

import state from './variables.js';
import { playSong } from "./player.js";
import {updateQueueIndex} from './saveInfo.js';

let queueModalBody;

document.addEventListener("DOMContentLoaded", () => {
  queueModalBody = document.getElementById("queueModalBody");
});


export function populateQueueUI() {
  queueModalBody.innerHTML = "";
  
  if (state.songQueue.length === 0) {   a
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
    
    // Make queue items clickable to play
    el.addEventListener('click', () => {
      state.songIndex = i;
      playSong(song.url, song.title, song.artist);
      populateQueueUI(); // Refresh to update current song highlight
      updateQueueIndex();
    });
    
    queueModalBody.appendChild(el);
  });
}
