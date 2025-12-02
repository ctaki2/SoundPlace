// app.js 

import {updateTimeLabel, showTemporaryNotification} from './helper.js';
import {saveQueue, saveManualQueue, updateQueueIndex, saveHistory, saveIntList} from './saveInfo.js';
import state, {pubUsername} from './variables.js'
import {setCurrentSongRef, populateQueueUI, populateHistoryUI, populatePlaylistsUI} from "./ui.js";
import {initMap, focusPinById, highlightMarkersByGenres, clearGenreHighlights} from "./map.js";
import { initSettings, renderProfileStats } from "./settings.js";

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
      state.shareLoc = userData.shareLoc
        state.intList = userData.intList
        // load user volume (0-100) - coerce and preserve 0
        if (userData.volume !== undefined && userData.volume !== null) {
          state.volume = Number(userData.volume);
        } else {
          state.volume = (state.volume !== undefined && state.volume !== null) ? state.volume : 80;
        }
        // load user autoQueueDistance
        if (userData.autoQueueDistance !== undefined && userData.autoQueueDistance !== null) {
          state.autoQueueDistance = Number(userData.autoQueueDistance);
        } else {
          state.autoQueueDistance = (state.autoQueueDistance !== undefined && state.autoQueueDistance !== null) ? state.autoQueueDistance : 150;
        }
      console.log("User loaded:", userData);
    } else {
      console.warn("User load failed:", data.message);
    }

    document.getElementById("openSettingsBtn").textContent = pubUsername[0]

    document.getElementById("shareLocBtn").checked = state.shareLoc;
    document.getElementById("FindMe").style.display = state.shareLoc ? "block" : "none";

    document.getElementById("intListBtn").checked = state.intList;
    document.getElementById("prevBtn").style.display = !state.intList ? "block" : "none";
    document.getElementById("nextBtn").style.display = !state.intList ? "block" : "none";

    // apply persisted volume (0-100 -> 0-1)
    try {
      audioPlayer.volume = (typeof state.volume === 'number') ? (state.volume / 100) : 0.8;
    } catch (e) { }

    // update settings UI slider if present (in case initSettings ran earlier)
    try {
      const vs = document.getElementById('volumeSlider');
      const vv = document.getElementById('volumeValue');
      if (vs) {
        vs.value = (typeof state.volume === 'number') ? String(state.volume) : '80';
        if (vv) vv.textContent = vs.value;
      }
    } catch (e) {}

    // update autoQueueDistance UI slider if present
    try {
      const ads = document.getElementById('autoQueueDistanceSlider');
      const adv = document.getElementById('autoQueueDistanceValue');
      if (ads) {
        ads.value = (typeof state.autoQueueDistance === 'number') ? String(state.autoQueueDistance) : '150';
        if (adv) adv.textContent = ads.value;
      }
    } catch (e) {}


    populateHistoryUI();
    populateQueueUI();
    populatePlaylistsUI();   

    // update settings/profile stats UI now that history is loaded
    try { renderProfileStats(); } catch (e) {}

    initMap({
        onPlay: playSong,
        onQueue: (url, title, artist, auto) => {
            if (!auto) state.ManualQueue++;
            saveManualQueue()
            queueSong(url, title, artist, auto);
        },
        socket
    });
  });

  
export const audioPlayer = new Audio()
// expose for other modules (settings) to adjust volume without circular import
window.audioPlayer = audioPlayer;
const songInfo = document.getElementById("songInfo");
const playBtn = document.getElementById("playBtn"); const prevBtn = document.getElementById("prevBtn"); const nextBtn = document.getElementById("nextBtn");
const showQueueBtn = document.getElementById("showQueueBtn"); const showPlaylistBtnRight = document.getElementById("showPlaylistBtnRight"); const playlistBtn = document.getElementById("playlistBtn"); 
const historyBtn = document.getElementById("historyBtn")
const seekSlider = document.getElementById("seekSlider");
const playlistDropdown = document.querySelector("#player-actions .dropdown");
const queueModal = document.getElementById("queueModal"); const playlistModal = document.getElementById("playlistModal"); const historyModal = document.getElementById("historyModal")
const modalOverlay = document.getElementById("modalOverlay"); const closeButtons = document.querySelectorAll('.modal-close');





// MODAL CONTROLS
export function openModal(modal) {
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

initSettings();


const friendsBtn = document.getElementById("friendsBtn");
const friendsModal = document.getElementById("friendsModal");

friendsBtn.addEventListener("click", () => {
    loadFriendsUI();
    openModal(friendsModal);
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
    try { renderProfileStats(); } catch (e) {}
  }

  seekSlider.value = currentTime;
  updateTimeLabel();
});



// ----------------- Genre filter UI -----------------
const genreFilterBtn = document.getElementById('genreFilterBtn');
let genreFilterDropdown = document.getElementById('genreFilterDropdown');

function ensureGenreDropdown() {
  if (!genreFilterDropdown) genreFilterDropdown = document.getElementById('genreFilterDropdown');
}

function openGenreDropdown() {
  ensureGenreDropdown();
  if (!genreFilterDropdown) return;
  genreFilterDropdown.classList.remove('hidden');
  genreFilterDropdown.setAttribute('aria-hidden', 'false');
  if (genreFilterBtn) genreFilterBtn.textContent = 'Genres ▴';
}

function closeGenreDropdown() {
  ensureGenreDropdown();
  if (!genreFilterDropdown) return;
  genreFilterDropdown.classList.add('hidden');
  genreFilterDropdown.setAttribute('aria-hidden', 'true');
  if (genreFilterBtn) genreFilterBtn.textContent = 'Genres ▾';
}

function toggleGenreDropdown() {
  ensureGenreDropdown();
  if (!genreFilterDropdown) return;
  if (genreFilterDropdown.classList.contains('hidden')) openGenreDropdown(); else closeGenreDropdown();
}

if (genreFilterBtn) {
  genreFilterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleGenreDropdown();
    try { console.log('genreFilterBtn click toggle'); } catch (e) {}
  });

  // Close when clicking elsewhere
  document.addEventListener('click', (e) => {
    ensureGenreDropdown();
    if (!genreFilterBtn.contains(e.target) && genreFilterDropdown && !genreFilterDropdown.contains(e.target)) {
      closeGenreDropdown();
    }
  });

  // Prevent clicks inside dropdown from closing it immediately
  document.addEventListener('click', (e) => {
    ensureGenreDropdown();
    if (genreFilterDropdown && genreFilterDropdown.contains(e.target)) {
      e.stopPropagation && e.stopPropagation();
    }
  }, true);

  // Fetch pins to build genre list
  fetch('/api/pins')
    .then(res => res.json())
    .then(pins => {
      ensureGenreDropdown();
      if (!genreFilterDropdown || !Array.isArray(pins)) return;
      const genres = Array.from(new Set(pins.map(p => (p.genre || '').toLowerCase().trim()).filter(Boolean))).sort();
      genreFilterDropdown.innerHTML = '';

      genres.forEach(g => {
        const id = `genre-${g.replace(/\s+/g,'_')}`;
        const label = document.createElement('label');
        label.className = 'genre-option';
        label.innerHTML = `<input type="checkbox" id="${id}" data-genre="${g}"> ${g.charAt(0).toUpperCase() + g.slice(1)}`;
        genreFilterDropdown.appendChild(label);

        const cb = label.querySelector('input');
        cb.addEventListener('change', () => {
          const checked = Array.from(genreFilterDropdown.querySelectorAll('input[type=checkbox]:checked')).map(i => i.dataset.genre);
          if (checked.length === 0) clearGenreHighlights(); else highlightMarkersByGenres(checked);
        });
      });
    })
    .catch(() => {});
}


const searchInput = document.getElementById("userSearchInput");
const dropdown = document.getElementById("userSearchDropdown");

let pinsCache = null;
let pinsCachePromise = null;
let pinsCacheTimestamp = 0;
const PIN_CACHE_TTL = 60 * 1000;

function loadPinsForSearch() {
  const now = Date.now();
  if (pinsCache && now - pinsCacheTimestamp < PIN_CACHE_TTL) {
    return Promise.resolve(pinsCache);
  }
  if (pinsCachePromise) {
    return pinsCachePromise;
  }

  pinsCachePromise = fetch('/api/pins')
    .then(res => res.json())
    .then(pins => {
      const normalized = Array.isArray(pins) ? pins : [];
      pinsCache = normalized;
      pinsCacheTimestamp = Date.now();
      return normalized;
    })
    .catch(err => {
      console.warn('Failed to load pins for search', err);
      return [];
    })
    .finally(() => {
      pinsCachePromise = null;
    });

  return pinsCachePromise;
}

let searchTimeout = null;
let searchSequenceId = 0;

searchInput.addEventListener("input", function () {
    const query = this.value.trim();

    clearTimeout(searchTimeout);

    if (query.length === 0) {
        searchSequenceId++;
        dropdown.classList.add("hidden");
        dropdown.innerHTML = "";
        return;
    }

    const requestId = ++searchSequenceId;

    searchTimeout = setTimeout(() => {
      const usersPromise = fetch(`/api/searchUsers?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .catch(() => ({ success: false, users: [] }));

      Promise.all([usersPromise, loadPinsForSearch()])
        .then(([userData, pins]) => {
          if (requestId !== searchSequenceId) return;

          dropdown.innerHTML = "";

          const users = (userData.success && Array.isArray(userData.users)) ? userData.users : [];
          const q = query.toLowerCase();
          const songs = (pins || []).filter(pin => {
            const haystack = `${pin.song || ''} ${pin.artist || ''}`.toLowerCase();
            return haystack.includes(q);
          }).slice(0, 12);

          const hasUsers = users.length > 0;
          const hasSongs = songs.length > 0;

          if (!hasUsers && !hasSongs) {
            dropdown.innerHTML = `<div class="search-empty">No results</div>`;
            dropdown.classList.remove("hidden");
            return;
          }

          if (hasUsers) {
            users.forEach(user => {
              const item = document.createElement("div");
              item.className = "search-result-item";
              item.innerHTML = `
                <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                  <div class="user-name">${user.username}</div>
                </div>
              `;

              item.onclick = () => {
                dropdown.classList.add("hidden");
                dropdown.innerHTML = "";
                openUserProfile(user.username);
              };

              dropdown.appendChild(item);
            });
          }

          if (hasSongs) {
            songs.forEach(song => {
              const item = document.createElement('div');
              item.className = 'search-result-item song-item';
              item.innerHTML = `
                <div class="song-info">
                  <div class="song-title">${song.song}</div>
                  <div class="song-artist">${song.artist}</div>
                </div>
              `;

              item.onclick = () => {
                dropdown.classList.add('hidden');
                dropdown.innerHTML = '';
                try { focusPinById(song.id); } catch (e) { console.warn('focusPin failed', e); }
              };

              dropdown.appendChild(item);
            });
          }

          dropdown.classList.remove("hidden");
        })
        .catch(() => {
          if (requestId !== searchSequenceId) return;
          dropdown.classList.add('hidden');
        });
    }, 250);
});

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    if (!searchInput.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.add("hidden");
    }
});

// Optional: Add keyboard navigation
searchInput.addEventListener('keydown', function(event) {
    const items = dropdown.querySelectorAll('.search-result-item');
    const activeItem = dropdown.querySelector('.search-result-item.active');
    
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!activeItem) {
            items[0]?.classList.add('active');
        } else {
            const next = activeItem.nextElementSibling;
            if (next) {
                activeItem.classList.remove('active');
                next.classList.add('active');
            }
        }
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (activeItem) {
            const prev = activeItem.previousElementSibling;
            if (prev) {
                activeItem.classList.remove('active');
                prev.classList.add('active');
            }
        }
    } else if (event.key === 'Enter' && activeItem) {
        event.preventDefault();
        activeItem.click();
    }
});
// Clicking outside hides dropdown
document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add("hidden");
    }
});


function openUserProfile(username) {
    fetch(`/api/getUser/${username}`)
    .then(res => res.json())
    .then(async (data) => {
        if (!data.success) return;

        const user = data.data;
        const historyArr = Array.isArray(user.history) ? user.history : [];

        const nowPlayingContainer = document.getElementById("profileNowPlaying");
        if (nowPlayingContainer) {
          nowPlayingContainer.innerHTML = "";
          const latestPlay = user.currentSong || historyArr[historyArr.length - 1];

          if (latestPlay && (latestPlay.title || latestPlay.artist)) {
            nowPlayingContainer.innerHTML = `
              <div class="now-playing-item">
                <div class="now-playing-content">
                  <div class="now-playing-track">
                    <span class="track-title">${latestPlay.title || 'Unknown Title'}</span>
                    <span class="track-artist">${latestPlay.artist || 'Unknown Artist'}</span>
                  </div>
                </div>
              </div>
            `;
          } else {
            nowPlayingContainer.innerHTML = '<p class="empty-state">No recent plays</p>';
          }
        }

        // Fill modal basic info
        document.getElementById("profileUsername").innerText = `${username}'s Profile`;
        
        const playlists = user.playlists || {};
        // profileAvatar element removed from modal; no avatar displayed

        // Populate playlists
        const playlistsList = document.getElementById("profilePlaylistsList");
        playlistsList.innerHTML = "";
        
        if (Object.keys(playlists).length === 0) {
          playlistsList.innerHTML = '<p class="empty-state">No playlists yet</p>';
        } else {
          Object.keys(playlists).forEach(playlistName => {
            const playlistSongs = playlists[playlistName] || [];
            const playlistDiv = document.createElement("div");
            playlistDiv.className = "profile-playlist-item";
            playlistDiv.innerHTML = `
              <div class="playlist-header">
                <span class="playlist-name">${playlistName}</span>
                <span class="playlist-count">${playlistSongs.length} ${playlistSongs.length === 1 ? 'song' : 'songs'}</span>
              </div>
              <div class="playlist-songs">
                ${playlistSongs.slice(0, 3).map((song, idx) => `
                  <div class="playlist-song">
                    <span class="song-title">${song.title || 'Unknown'}</span>
                    <span class="song-artist">${song.artist || 'Unknown Artist'}</span>
                  </div>
                `).join('')}
                ${playlistSongs.length > 3 ? `<div class="playlist-more">+${playlistSongs.length - 3} more</div>` : ''}
              </div>
            `;
            playlistsList.appendChild(playlistDiv);
          });
        }

          // Populate top songs (computed from history)
          const topSongsList = document.getElementById("profileTopSongsList");
          topSongsList.innerHTML = "";

          if (historyArr.length === 0) {
            topSongsList.innerHTML = '<p class="empty-state">No history yet</p>';
          } else {
            // count plays by URL
            const counts = {};
            historyArr.forEach(entry => {
              const key = entry.url || `${entry.artist}::${entry.title}`;
              if (!counts[key]) counts[key] = { url: entry.url, title: entry.title || 'Unknown', artist: entry.artist || 'Unknown', count: 0 };
              counts[key].count++;
            });

            const top = Object.values(counts).sort((a,b) => b.count - a.count).slice(0,5);

            top.forEach((s, idx) => {
              const item = document.createElement('div');
              item.className = 'profile-playlist-item top-song-item';
              item.innerHTML = `
                <div class="top-song-compact">
                  <span class="top-song-pos">${idx+1}.</span>
                  <span class="top-song-title">${s.title}</span>
                  <span class="top-song-artist">— ${s.artist}</span>
                </div>
              `;
              topSongsList.appendChild(item);
            });
          }

        // Fetch friend data for friends count and determine relationship status
        const viewerRes = await fetch(`/api/friend/list/${pubUsername}`);
        const viewerData = await viewerRes.json();
        const viewerFriends = (viewerData.success && viewerData.friends) ? viewerData.friends : [];
        const viewerSent = (viewerData.success && viewerData.requestsSent) ? viewerData.requestsSent : [];
        const viewerReceived = (viewerData.success && viewerData.requestsReceived) ? viewerData.requestsReceived : [];

        // (profile friend count display removed per UI change)

        // Determine relationship status
        const isFriend = viewerFriends.includes(username);
        const sentRequest = viewerSent.includes(username);
        const receivedRequest = viewerReceived.includes(username);

        // Build friend action area
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "profile-actions";

        // Helper to simplify creating buttons
        function makeBtn(id, text, onClick) {
          const b = document.createElement("button");
          b.id = id;
          b.className = "nav-btn";
          b.textContent = text;
          b.onclick = onClick;
          return b;
        }

        // Clear existing actions area and re-add
        const oldActions = document.querySelector("#userProfileModal .profile-actions");
        if (oldActions) oldActions.remove();

        const profileBody = document.getElementById("userProfileBody");
        profileBody.appendChild(actionsDiv);

        if (username === pubUsername) {
          document.getElementById("profileUsername").innerText = 'Your Profile'
          // viewing self: show nothing (or settings)
          actionsDiv.appendChild(makeBtn("profileEditBtn", "Edit Profile", () => { openModal(settingsModal); }));
        } else if (isFriend) {
          actionsDiv.appendChild(makeBtn("removeFriendBtn", "Remove Friend", async () => {
            await fetch("/api/friend/remove", { method: "POST", headers: {'Content-Type':'application/json'}, body: JSON.stringify({ a: pubUsername, b: username })});
            showTemporaryNotification(`Removed ${username}`);
            openUserProfile(username); // refresh modal state
          }));

          // Optionally add "View Live Location" / "Follow" features here
        } else if (sentRequest) {
          actionsDiv.appendChild(makeBtn("cancelRequestBtn", "Cancel Request", async () => {
            await fetch("/api/friend/cancel", { method: "POST", headers: {'Content-Type':'application/json'}, body: JSON.stringify({ from: pubUsername, to: username })});
            showTemporaryNotification(`Cancelled request to ${username}`);
            openUserProfile(username);
          }));
        } else if (receivedRequest) {
          actionsDiv.appendChild(makeBtn("acceptBtn", "Accept", async () => {
            await fetch("/api/friend/accept", { method: "POST", headers: {'Content-Type':'application/json'}, body: JSON.stringify({ from: username, to: pubUsername })});
            showTemporaryNotification(`You and ${username} are now friends`);
            openUserProfile(username);
          }));
          actionsDiv.appendChild(makeBtn("declineBtn", "Decline", async () => {
            await fetch("/api/friend/decline", { method: "POST", headers: {'Content-Type':'application/json'}, body: JSON.stringify({ from: username, to: pubUsername })});
            showTemporaryNotification(`Declined ${username}'s request`);
            openUserProfile(username);
          }));
        } else {
          actionsDiv.appendChild(makeBtn("addFriendBtn", "Add Friend", async () => {
            await fetch("/api/friend/send", { method: "POST", headers: {'Content-Type':'application/json'}, body: JSON.stringify({ from: pubUsername, to: username })});
            showTemporaryNotification(`Friend request sent to ${username}`);
            openUserProfile(username);
          }));
        }

        // finally open modal
        openModal(document.getElementById("userProfileModal"));
    })
    .catch(err => {
      console.error("Profile load failed", err);
    });
}


// ---------- Render friends UI (no per-button onclicks) ----------
function loadFriendsUI() {
  const body = document.getElementById("friendsModalBody");
  body.innerHTML = "<p>Loading...</p>";

  fetch(`/api/friend/list/${pubUsername}`)
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        body.innerHTML = `<p>Failed to load friends.</p>`;
        return;
      }

      const { friends = [], requestsReceived = [], requestsSent = [] } = data;

      body.innerHTML = ""; // clear

      // FRIENDS
      const friendSection = document.createElement("div");
      friendSection.innerHTML = `<h3>Your Friends</h3>`;
      if (friends.length === 0) {
        friendSection.innerHTML += `<p>No friends yet.</p>`;
      } else {
        friends.forEach(u => {
          const item = document.createElement("div");
          item.className = "friend-item";
          // view button uses data-action and data-user
          item.innerHTML = `
            <span class="friend-name">${u}</span>
            <button type="button" class="nav-btn" data-action="view" data-user="${u}">View</button>
            <button type="button" class="nav-btn" data-action="unfriend" data-user="${u}">Unfriend</button>
          `;
          friendSection.appendChild(item);
        });
      }

      // RECEIVED
      const recvSection = document.createElement("div");
      recvSection.innerHTML = `<h3>Friend Requests</h3>`;
      if (requestsReceived.length === 0) {
        recvSection.innerHTML += `<p>No incoming requests.</p>`;
      } else {
        requestsReceived.forEach(u => {
          const row = document.createElement("div");
          row.className = "friend-row";
          row.innerHTML = `
            <span>${u}</span>
            <button type="button" class="nav-btn" data-action="accept" data-user="${u}">Accept</button>
            <button type="button" class="nav-btn" data-action="decline" data-user="${u}">Decline</button>
          `;
          recvSection.appendChild(row);
        });
      }

      // SENT
      const sentSection = document.createElement("div");
      sentSection.innerHTML = `<h3>Sent Requests</h3>`;
      if (requestsSent.length === 0) {
        sentSection.innerHTML += `<p>No pending requests.</p>`;
      } else {
        requestsSent.forEach(u => {
          const row = document.createElement("div");
          row.className = "friend-row";
          row.innerHTML = `
            <span>${u}</span>
            <button type="button" class="nav-btn" data-action="cancel" data-user="${u}">Cancel Request</button>
          `;
          sentSection.appendChild(row);
        });
      }

      // Append
      body.appendChild(friendSection);
      body.appendChild(document.createElement("hr"));
      body.appendChild(recvSection);
      body.appendChild(document.createElement("hr"));
      body.appendChild(sentSection);
    })
    .catch(err => {
      console.error("Failed to load friends:", err);
      document.getElementById("friendsModalBody").innerHTML = `<p>Error loading friends.</p>`;
    });
}

// ---------- Event delegation for Friends modal ----------
// This ensures click handlers survive re-render and aren't blocked by bubbling issues.
const friendsModalBody = document.getElementById("friendsModalBody");

// remove any existing listener (safe to call multiple times)
if (friendsModalBody._friendsHandler) {
  friendsModalBody.removeEventListener("click", friendsModalBody._friendsHandler);
}

friendsModalBody._friendsHandler = async function (e) {
  const btn = e.target.closest("button[data-action], button[data-user]");
  if (!btn) return;

  // prevent any overlay/window click handlers from interfering
  e.stopPropagation();
  e.preventDefault();

  const action = btn.getAttribute("data-action");
  const username = btn.getAttribute("data-user");

  console.log("Friends modal action:", action, username);

  try {
    if (action === "view") {
      openUserProfile(username);
      return;
    }

    if (action === "accept") {
      // incoming request: from = requester (username), to = me (pubUsername)
      const res = await fetch("/api/friend/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: username, to: pubUsername })
      });
      const j = await res.json().catch(() => ({}));
      showTemporaryNotification(j.message || `Accepted ${username}`);
      loadFriendsUI();
      return;
    }

    if (action === "decline") {
      const res = await fetch("/api/friend/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: username, to: pubUsername })
      });
      const j = await res.json().catch(() => ({}));
      showTemporaryNotification(j.message || `Declined ${username}`);
      loadFriendsUI();
      return;
    }

    if (action === "cancel") {
      // cancel a request I sent: from = me, to = username
      const res = await fetch("/api/friend/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: pubUsername, to: username })
      });
      const j = await res.json().catch(() => ({}));
      showTemporaryNotification(j.message || `Cancelled request to ${username}`);
      loadFriendsUI();
      return;
    }

    if (action === "unfriend") {
      // remove friend (unfriend)
      const res = await fetch("/api/friend/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a: pubUsername, b: username })
      });
      const j = await res.json().catch(() => ({}));
      showTemporaryNotification(j.message || `Removed ${username}`);
      loadFriendsUI();
      return;
    }

    // fallback: if there is a button with only data-user (no data-action), treat as view
    if (!action && username) {
      openUserProfile(username);
    }
  } catch (err) {
    console.error("Friends action failed:", err);
    showTemporaryNotification("Action failed");
  }
};

friendsModalBody.addEventListener("click", friendsModalBody._friendsHandler);




