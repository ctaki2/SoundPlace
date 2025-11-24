// settings.js

import state, {pubUsername}from "./variables.js";
import { saveIntList } from "./saveInfo.js";
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

}

