// helper.js

import {audioPlayer} from './app.js';

const timeLabel = document.getElementById("timeLabel");
const notification = document.getElementById("notification");

export function escapeHtml(unsafe) {
  return String(unsafe || "").replace(/[&<>"'`]/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;"
  }[m]));
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function updateTimeLabel() {
  timeLabel.textContent = `${formatTime(audioPlayer.currentTime)} / ${formatTime(audioPlayer.duration)}`;
}

export function showTemporaryNotification(text, ms = 1400) {
  notification.textContent = text;
  notification.classList.add("show");
  clearTimeout(notification._t);
  notification._t = setTimeout(() => notification.classList.remove("show"), ms);
}
