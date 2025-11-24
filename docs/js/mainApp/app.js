// app.js 

import {updateTimeLabel, showTemporaryNotification} from './helper.js';
import {saveQueue, saveManualQueue, updateQueueIndex, saveHistory, saveIntList} from './saveInfo.js';
import state, {pubUsername} from './variables.js'
import {setCurrentSongRef, populateQueueUI, populateHistoryUI, populatePlaylistsUI} from "./ui.js";
import {initMap} from "./map.js";
import { initSettings } from "./settings.js";

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


    populateHistoryUI();
    populateQueueUI();
    populatePlaylistsUI();   

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
  }

  seekSlider.value = currentTime;
  updateTimeLabel();
});

const searchInput = document.getElementById("userSearchInput");
const dropdown = document.getElementById("userSearchDropdown");

let searchTimeout = null;
searchInput.addEventListener("input", function () {
    const query = this.value.trim();

    // Clear previous typing delay
    clearTimeout(searchTimeout);

    // Don't search empty
    if (query.length === 0) {
        dropdown.classList.add("hidden");
        dropdown.innerHTML = "";
        return;
    }

    // Delay typing by 250ms before search
    searchTimeout = setTimeout(() => {
        fetch(`/api/searchUsers?q=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => {
                if (!data.success) return;

                dropdown.innerHTML = "";

                if (data.users.length === 0) {
                    dropdown.innerHTML = `<div>No users found</div>`;
                    dropdown.classList.remove("hidden");
                    return;
                }

                data.users.forEach(user => {
                    const item = document.createElement("div");
                    item.textContent = user.username;

                    item.onclick = () => {
                        dropdown.classList.add("hidden");
                        dropdown.innerHTML = "";
                        openUserProfile(user.username);
                    };


                    dropdown.appendChild(item);
                });

                dropdown.classList.remove("hidden");
            });
    }, 250);
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

        // Fill modal basic info
        document.getElementById("profileUsername").innerText = `${username}'s Profile`;
        document.getElementById("profileName").innerText = username;
        document.getElementById("profileHistoryCount").innerText = user.history?.length || 0;
        document.getElementById("profilePlaylistCount").innerText = Object.keys(user.playlists || {}).length;
        document.getElementById("profileAvatar").src = user.avatar || "/images/default-avatar.jpg";

        // Fetch current viewer's friend state (pubUsername)
        const viewerRes = await fetch(`/api/friend/list/${pubUsername}`);
        const viewerData = await viewerRes.json();
        const viewerFriends = (viewerData.success && viewerData.friends) ? viewerData.friends : [];
        const viewerSent = (viewerData.success && viewerData.requestsSent) ? viewerData.requestsSent : [];
        const viewerReceived = (viewerData.success && viewerData.requestsReceived) ? viewerData.requestsReceived : [];

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




