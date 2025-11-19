// saveInfo.js

import state, { pubUsername } from './variables.js';

export async function savePlaylists() {
  try {
    const res = await fetch(`/api/getUser/${pubUsername}`);
    const data = await res.json();
    if (!data.success) return;

    const serverPlaylists = data.data.playlists || {};
    const mergedPlaylists = { ...serverPlaylists };

    for (const [name, songs] of Object.entries(state.playlists)) {
      if (!mergedPlaylists[name]) mergedPlaylists[name] = [];
      songs.forEach(s => {
        if (!mergedPlaylists[name].find(x => x.url === s.url)) {
          mergedPlaylists[name].push(s);
        }
      });
    }

    await fetch("/api/updateUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: pubUsername, updates: { playlists: mergedPlaylists } })
    });

    state.playlists = mergedPlaylists; // update local playlists
  } catch (err) {
    console.error(err);
  }
}

export async function saveQueue() {
  try {
    const res = await fetch(`/api/getUser/${pubUsername}`);
    const data = await res.json();
    if (!data.success) return;

    const serverQueue = data.data.queue || [];
    const mergedQueue = [...serverQueue];

    state.songQueue.forEach(s => {
      if (!mergedQueue.find(q => q.url === s.url)) mergedQueue.push(s);
    });

    await fetch("/api/updateUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: pubUsername, updates: { queue: mergedQueue } })
    });

    state.songQueue = mergedQueue; // update local queue
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

export async function saveHistory() {
}