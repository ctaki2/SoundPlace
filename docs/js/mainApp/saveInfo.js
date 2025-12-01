// saveInfo.js

import state, { pubUsername } from './variables.js';

export async function savePlaylists() {
  try {
    // Send the client-side playlists as authoritative — replace server copy
    await fetch("/api/updateUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: pubUsername, updates: { playlists: state.playlists } })
    });
  } catch (err) {
    console.error(err);
  }
}

export async function saveQueue() {
  try {
    await fetch("/api/updateUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: pubUsername,
        updates: { queue: state.songQueue }
      })
    });
  } catch (err) {
    console.error(err);
  }
}


export async function saveManualQueue() {
  try {
    await fetch("/api/updateUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: pubUsername, updates: { manualQueue: state.ManualQueue } })
    });
  } catch (err) {
    console.error(err);
  }
}

export function updateQueueIndex() {
  fetch("/api/updateUser", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: pubUsername, updates: { queueIndex: state.songIndex } })
  }).catch(console.error);
}

export async function saveHistory(songs) {
  try {
    await fetch("/api/updateUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: pubUsername, updates: { history: songs } })
    });
  } catch (err) {
    console.error(err);
  }
}

export async function saveFriends() {

}

export async function saveShareLoc() {

  try {
    await fetch("/api/updateUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: pubUsername, updates: { shareLoc: state.shareLoc } })
    });
  } catch (err) {
    console.error(err);
  }

}

export async function saveIntList() {

  try {
    await fetch("/api/updateUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: pubUsername, updates: { intList: state.intList } })
    });
  } catch (err) {
    console.error(err);
  }

}

export async function saveVolume() {
  try {
    await fetch("/api/updateUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: pubUsername, updates: { volume: Number(state.volume) } })
    });
  } catch (err) {
    console.error(err);
  }
}