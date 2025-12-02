// settings.js

import state, {pubUsername}from "./variables.js";
import { saveIntList, saveVolume, saveAutoQueueDistance } from "./saveInfo.js";
import { openModal } from "./app.js";

// Helper to update constraint indicators
function updateConstraintIndicators() {
  const constraintsContainer = document.getElementById("active-constraints");
  const constraintsList = document.getElementById("constraints-list");
  
  if (!constraintsContainer || !constraintsList) return;
  
  const activeConstraints = [];
  
  if (state.intList) {
    activeConstraints.push({ label: 'No Skipping', icon: '🚫', className: 'constraint-skip' });
  }
  if (!state.shareLoc) {
    activeConstraints.push({ label: 'Location Hidden', icon: '🔒', className: 'constraint-location' });
  }
  
  if (activeConstraints.length > 0) {
    constraintsContainer.style.display = 'block';
    constraintsList.innerHTML = activeConstraints.map(c => 
      `<span class="constraint-indicator ${c.className}" title="${c.label}">${c.icon} ${c.label}</span>`
    ).join('');
  } else {
    constraintsContainer.style.display = 'none';
  }
}

export function initSettings() {
  // SETTINGS MODAL CONTROLS
  const settingsModal = document.getElementById("settingsModal");
  const settingsTabs = document.querySelectorAll(".settings-tab");
  const settingsSections = document.querySelectorAll(".settings-section");

  // username labels
  const usernameLabel = document.getElementById("settings-username");
  const usernameDisplay = document.getElementById("settings-username-display");
  const accountUsernameDisplay = document.getElementById("account-username-display");
  const accountPasswordDisplay = document.getElementById("account-password-display");
  
  if (usernameLabel) usernameLabel.innerText = pubUsername;
  if (usernameDisplay) usernameDisplay.innerText = pubUsername;
  if (accountUsernameDisplay) accountUsernameDisplay.innerText = pubUsername;

  // Fetch and display current password
  if (accountPasswordDisplay) {
    fetch(`/api/getUser/${pubUsername}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.password) {
          accountPasswordDisplay.innerText = data.data.password;
        }
      })
      .catch(err => console.error("Failed to load password:", err));
  }

  // open settings modal
  const openSettingsBtn = document.getElementById("openSettingsBtn");
  if (openSettingsBtn) {
    openSettingsBtn.addEventListener("click", () => {
      openModal(settingsModal);
      updateConstraintIndicators();
    });
  }

  // tab switching - FIXED
  settingsTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      settingsTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const target = tab.dataset.section;

      settingsSections.forEach(section => {
        // Remove active class from all sections
        section.classList.remove("active");
        // Add active class only to the target section
        if (section.id === `section-${target}`) {
          section.classList.add("active");
        }
      });
      
      // Update constraints when opening Controls section
      if (target === 'controls') {
        updateConstraintIndicators();
      }
    });
  });

  // INT LIST TOGGLE
  const intListBtn = document.getElementById("intListBtn");
  if (intListBtn) {
    intListBtn.addEventListener("click", () => {
      state.intList = !state.intList;

      saveIntList();

      const prevBtn = document.getElementById("prevBtn");
      const nextBtn = document.getElementById("nextBtn");

      if (prevBtn) prevBtn.style.display = !state.intList ? "block" : "none";
      if (nextBtn) nextBtn.style.display = !state.intList ? "block" : "none";
      
      // Update constraint display
      updateConstraintIndicators();
    });
  }

  // VOLUME SLIDER
  const volumeSlider = document.getElementById("volumeSlider");
  const volumeValue = document.getElementById("volumeValue");
  if (volumeSlider && volumeValue) {
    // initialize from state (preserve 0)
    const initVol = (typeof state.volume === 'number') ? state.volume : (state.volume ?? 80);
    volumeSlider.value = String(initVol);
    volumeValue.textContent = String(initVol);

    volumeSlider.addEventListener("input", () => {
      const v = parseInt(volumeSlider.value, 10);
      state.volume = v;
      volumeValue.textContent = v;

      // apply immediately if audio player exists globally
      try {
        if (window.audioPlayer) window.audioPlayer.volume = (v / 100);
      } catch (e) {}
    });

    volumeSlider.addEventListener("change", () => {
      // persist on change commit
      saveVolume();
    });
  }

  // AUTO QUEUE DISTANCE SLIDER
  const autoQueueDistanceSlider = document.getElementById("autoQueueDistanceSlider");
  const autoQueueDistanceValue = document.getElementById("autoQueueDistanceValue");
  if (autoQueueDistanceSlider && autoQueueDistanceValue) {
    // initialize from state
    const initDistance = (typeof state.autoQueueDistance === 'number') ? state.autoQueueDistance : 150;
    autoQueueDistanceSlider.value = String(initDistance);
    autoQueueDistanceValue.textContent = String(initDistance);

    autoQueueDistanceSlider.addEventListener("input", () => {
      const d = parseInt(autoQueueDistanceSlider.value, 10);
      state.autoQueueDistance = d;
      autoQueueDistanceValue.textContent = d;
    });

    autoQueueDistanceSlider.addEventListener("change", () => {
      // persist on change commit
      saveAutoQueueDistance();
    });
  }

  // PASSWORD CHANGE HANDLER
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const newPasswordInput = document.getElementById("newPasswordInput");

  // Guard: only attach if both button and input exist
  if (changePasswordBtn && newPasswordInput) {
    changePasswordBtn.addEventListener("click", async () => {
      const newPassword = (newPasswordInput.value || '').trim();

      if (!newPassword) {
        alert("Please enter a new password");
        return;
      }

      if (newPassword.length < 6) {
        alert("Password must be at least 6 characters");
        return;
      }

      try {
        const res = await fetch("/api/account/changePassword", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: pubUsername, newPassword })
        });

        const data = await res.json();

        if (data.success) {
          alert("Password changed successfully");
          newPasswordInput.value = "";
        } else {
          alert("Password change failed: " + data.message);
        }
      } catch (err) {
        console.error("Password change error:", err);
        alert("Password change failed");
      }
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", () => {
      fetch("/api/logout", { method: "POST" })
          .then(() => {
              // Clear any local app state
              state.pubUsername = null;

              // Redirect to login page
              window.location.href = "/index.html";
          });
    });

    const deleteBtn = document.querySelector("#section-account .danger-btn:last-child");

    // Guard: element may be absent in some layouts
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to permanently delete your account? This cannot be undone.")) return;

      fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: pubUsername })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Account deleted");
          window.location.href = "/index.html";
        } else {
          alert("Delete failed: " + data.message);
        }
      });
      });
    }

}

export async function renderProfileStats() {
  const topSongsList = document.getElementById('settingsTopSongsList');
  if (!topSongsList) return;
  topSongsList.innerHTML = '';

  const historyArr = state.history || [];
  if (historyArr.length === 0) {
    topSongsList.innerHTML = '<p class="empty-state">No history yet</p>';
    // also clear genres if present
    const gclear = document.getElementById('settingsTopGenresList');
    if (gclear) gclear.innerHTML = '';
    return;
  }

  // compute top songs
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

  // compute top genres (try to use genre on history entry, else map via pins)
  let pins = [];
  try {
    const pres = await fetch('/api/pins');
    if (pres.ok) pins = await pres.json();
  } catch (e) { pins = []; }

  const urlToGenre = {};
  const titleArtistToGenre = {};
  pins.forEach(p => {
    if (p.audio_url) urlToGenre[(p.audio_url||'').trim()] = (p.genre||'').toLowerCase();
    const key = `${(p.artist||'').toLowerCase()}::${(p.song||'').toLowerCase()}`;
    titleArtistToGenre[key] = (p.genre||'').toLowerCase();
  });

  const genreCounts = {};
  historyArr.forEach(entry => {
    let g = (entry.genre || '').toString().toLowerCase();
    if (!g) {
      // try by url
      const u = (entry.url||'').trim();
      if (u && urlToGenre[u]) g = urlToGenre[u];
    }
    if (!g) {
      const k = `${(entry.artist||'').toLowerCase()}::${(entry.title||'').toLowerCase()}`;
      if (titleArtistToGenre[k]) g = titleArtistToGenre[k];
    }
    if (!g) return; // skip if unknown
    genreCounts[g] = (genreCounts[g] || 0) + 1;
  });

  const topGenres = Object.entries(genreCounts)
    .map(([genre,count]) => ({ genre, count }))
    .sort((a,b) => b.count - a.count)
    .slice(0,3);

  // render top genres (create a titled section under Top Songs)
  let genresSection = document.getElementById('settingsTopGenresSection');
  if (!genresSection) {
    genresSection = document.createElement('div');
    genresSection.id = 'settingsTopGenresSection';
    genresSection.style.marginTop = '10px';
    genresSection.innerHTML = `
      <h4 class="top-genres-heading">Top Genres</h4>
      <div id="settingsTopGenresList"></div>
    `;
    topSongsList.parentElement.appendChild(genresSection);
  }

  const genresContainer = document.getElementById('settingsTopGenresList');
  genresContainer.innerHTML = '';

  if (topGenres.length === 0) {
    genresContainer.innerHTML = '<p class="empty-state">No genre data</p>';
    return;
  }

  topGenres.forEach((g,i) => {
    const el = document.createElement('div');
    el.className = 'profile-playlist-item top-genre-item';
    // render position + genre name (no numeric count as requested)
    el.innerHTML = `<span class="top-genre-pos">${i+1}.</span> <span class="top-genre-name">${g.genre}</span>`;
    genresContainer.appendChild(el);
  });
}

