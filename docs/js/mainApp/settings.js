// settings.js

import state, {pubUsername}from "./variables.js";
import { saveIntList, saveVolume } from "./saveInfo.js";
import { openModal } from "./app.js";

export function initSettings() {
  // SETTINGS MODAL CONTROLS
  const settingsModal = document.getElementById("settingsModal");
  const settingsTabs = document.querySelectorAll(".settings-tab");
  const settingsSections = document.querySelectorAll(".settings-section");

  // username labels
  const usernameLabel = document.getElementById("settings-username");
  const usernameDisplay = document.getElementById("settings-username-display");
  if (usernameLabel) usernameLabel.innerText = pubUsername;
  if (usernameDisplay) usernameDisplay.innerText = pubUsername;

  // open settings modal
  const openSettingsBtn = document.getElementById("openSettingsBtn");
  if (openSettingsBtn) {
    openSettingsBtn.addEventListener("click", () => {
      openModal(settingsModal);
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

export function renderProfileStats() {
  const topSongsList = document.getElementById('settingsTopSongsList');
  if (!topSongsList) return;
  topSongsList.innerHTML = '';

  const historyArr = state.history || [];
  if (historyArr.length === 0) {
    topSongsList.innerHTML = '<p class="empty-state">No history yet</p>';
    return;
  }

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

