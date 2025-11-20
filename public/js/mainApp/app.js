// app.js 

import {updateTimeLabel, showTemporaryNotification} from './helper.js';
import {saveQueue, saveManualQueue, updateQueueIndex, saveHistory} from './saveInfo.js';
import state, {pubUsername} from './variables.js'
import {setCurrentSongRef, populateQueueUI, populateHistoryUI, populatePlaylistsUI} from "./ui.js";
import {initMap} from "./map.js";

const socket = io();
let userData = null;
let currentSong = null;

fetch(`/api/getUser/${pubUsername}`)
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      userData = data.data;
      state.songQueue = userData.queue || [];
      state.songIndex = userData.queueIndex || 0;
      state.playlists = userData.playlists || {};
      state.history = userData.history || [];
      state.ManualQueue = userData.manualQueue || 0;
      console.log("User loaded:", userData);
    } else {
      console.warn("User load failed:", data.message);
    }
    populateHistoryUI();
    populateQueueUI();
    populatePlaylistsUI();          // <-- will also bind the "Create New" button
  });


export const audioPlayer = new Audio()
const songInfo = document.getElementById("songInfo");
const playBtn = document.getElementById("playBtn"); const prevBtn = document.getElementById("prevBtn"); const nextBtn = document.getElementById("nextBtn");
const showQueueBtn = document.getElementById("showQueueBtn"); const showPlaylistBtnRight = document.getElementById("showPlaylistBtnRight"); const playlistBtn = document.getElementById("playlistBtn"); 
const historyBtn = document.getElementById("historyBtn")
const seekSlider = document.getElementById("seekSlider");
const playlistDropdown = document.querySelector("#top-bar .dropdown");
const queueModal = document.getElementById("queueModal"); const playlistModal = document.getElementById("playlistModal"); const historyModal = document.getElementById("historyModal")
const modalOverlay = document.getElementById("modalOverlay"); const closeButtons = document.querySelectorAll('.modal-close');

// MODAL CONTROLS
function openModal(modal) {
  closeAllModals();
  modal.classList.add('active');
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.remove('active');
  });
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Modal event listeners
showQueueBtn.addEventListener('click', () => openModal(queueModal));
historyBtn.addEventListener('click', () => openModal(historyModal));
showPlaylistBtnRight.addEventListener('click', () => openModal(playlistModal));
modalOverlay.addEventListener('click', closeAllModals);

closeButtons.forEach(button => {
  button.addEventListener('click', closeAllModals);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllModals();
  }
});


export function playSong(url, title, artist) {
  currentSong = { url, title, artist };
  setCurrentSongRef(currentSong);
  audioPlayer.src = url;
  audioPlayer.crossOrigin = "anonymous";
  audioPlayer.play().catch(() => {});
  songInfo.textContent = `${artist} — ${title}`;
  playBtn.classList.replace("play", "pause");
  populateQueueUI();

  if (!playProgress[url]) playProgress[url] = { played: 0, lastTime: 0, recorded: false };
  else playProgress[url].played = 0;
  playProgress[url].recorded = false;
  playProgress[url].lastTime = audioPlayer.currentTime;
}

export function queueSong(url, title, artist, auto) {

  if (auto) {
    state.songQueue.push({ url, title, artist });
  } else {
    state.songQueue.splice(state.ManualQueue-1, 0, { url, title, artist })
  }
  populateQueueUI(); // Refresh the queue modal
  showTemporaryNotification(`"${title}" queued`);
  saveQueue();  
}

window.playSong = playSong;
window.queueSong = queueSong

playBtn.onclick = () => {
  if (audioPlayer.paused) {
    audioPlayer.play();
    playBtn.classList.replace("play", "pause");
  } else {
    audioPlayer.pause();
    playBtn.classList.replace("pause", "play");
  }
};

prevBtn.onclick = () => {
  if (state.songIndex > 0) {
    state.songIndex--;
    const s = state.songQueue[state.songIndex];
    if (s) playSong(s.url, s.title, s.artist);
    updateQueueIndex();
  }
};

nextBtn.onclick = () => {
  if (state.songIndex < state.songQueue.length - 1) {
    state.songIndex++;
    const s = state.songQueue[state.songIndex];
    if (s) playSong(s.url, s.title, s.artist);
    updateQueueIndex();
  } else if (state.songQueue.length > 0) {
    // If we're at the end, loop back to start
    state.songIndex = 0;
    const s = state.songQueue[state.songIndex];
    if (s) playSong(s.url, s.title, s.artist);
    updateQueueIndex();
  }
};

audioPlayer.addEventListener("loadedmetadata", () => {
  seekSlider.max = audioPlayer.duration || 0;
  updateTimeLabel();
});

audioPlayer.addEventListener("timeupdate", () => {
  seekSlider.value = audioPlayer.currentTime;
  updateTimeLabel();
});

seekSlider.addEventListener("input", () => {
  audioPlayer.currentTime = seekSlider.value;
});

audioPlayer.onended = () => {
  if (state.songIndex < state.songQueue.length - 1) {
    nextBtn.onclick();
  } else {
    currentSong = null;
    songInfo.textContent = "No song playing";
    playBtn.classList.replace("pause", "play");
    populateQueueUI(); // Remove current song highlight
  }
};

playlistBtn.onclick = e => {
  e.stopPropagation();
  playlistDropdown.classList.toggle("active");
};

window.onclick = () => {
  document.querySelectorAll(".dropdown").forEach(d => d.classList.remove("active"));
};

initMap({
    onPlay: playSong,
    onQueue: (url, title, artist, auto) => {
        if (!auto) state.ManualQueue++;
        saveManualQueue()
        queueSong(url, title, artist, auto);
    },
    socket
});

const playProgress = {}; 
audioPlayer.addEventListener("timeupdate", () => {
  const url = currentSong?.url;
  if (!url || !audioPlayer.duration) return;

  const progress = playProgress[url];
  const currentTime = audioPlayer.currentTime;

  if (Math.abs(currentTime - progress.lastTime) < 1) {
    progress.played += currentTime - progress.lastTime;
  } else {
    progress.played = 0; // reset if skipped
  }

  progress.lastTime = currentTime;

  if (!progress.recorded && progress.played >= audioPlayer.duration * 0.05) {
    progress.recorded = true;
    const entry = { url, title: currentSong.title, artist: currentSong.artist, timestamp: Date.now() };
    state.history.push(entry);
    saveHistory([entry]);
    populateHistoryUI();
  }

  seekSlider.value = currentTime;
  updateTimeLabel();
});


