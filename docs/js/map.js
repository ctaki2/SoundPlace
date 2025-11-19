// map.js

import { distanceMeters } from "./helper.js";

const testingBtn = document.getElementById("testing");

let map, userMarker;
let autoCenterView = true;
export const Pins = {};

export function initMap({ onPlay, onQueue }) {
    map = L.map("map").setView([41.8781, -87.6298], 13);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        subdomains: "abcd",
        maxZoom: 19
    }).addTo(map);

    map.on("movestart", () => {
        autoCenterView = false;
    });
    const FindMe = document.getElementById("FindMe");
    FindMe.onclick = centerMapOnUser;


    // ------------------------
    // USER POSITION
    // ------------------------
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(pos => {
            const { latitude, longitude } = pos.coords;

            const testingBtn = document.getElementById("testing");
            // if (testingBtn)
            testingBtn.textContent = `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;


            if (!userMarker) {
                userMarker = L.circleMarker([latitude, longitude], {
                    radius: 8,
                    fillColor: "#64c8ff",
                    color: "#fff",
                    weight: 2,
                    fillOpacity: 1
                }).addTo(map);
                map.setView([latitude, longitude], 15);
            } else {
                userMarker.setLatLng([latitude, longitude]);
            }

            if (autoCenterView) {
                map.setView([latitude, longitude], 15);
            }

            autoQueueSong(latitude, longitude, onQueue);

        }, console.error, { enableHighAccuracy: true });
    }

    // ------------------------
    // SOCKET PINS
    // ------------------------
    const socket = io();
    socket.on("pins", pins => renderPins(pins, onPlay, onQueue));
}

function autoQueueSong(lat, lng, onQueue) {
    const now = Date.now();
    const pinsToQueue = [];

    for (const key in Pins) {
        const pin = Pins[key];
        const [pLat, pLng] = key.split(",").map(Number);

        if (distanceMeters(pLat, pLng, lat, lng) < 100) {
            const timeSince = now - (pin.lastQueuedAt || 0);

            if (timeSince >= 5 * 60 * 1000) {
                pinsToQueue.push(pin);
            }
        }
    }

    pinsToQueue.forEach(pin => {
        pin.lastQueuedAt = now;
        onQueue(pin.audio_url, pin.song, pin.artist, true); 
    });
}

function centerMapOnUser() {
    if (!map || !userMarker) {
        alert("Your location is not yet available.");
        return;
    }
    map.setView(userMarker.getLatLng(), 15);
}

function renderPins(pins, onPlay, onQueue) {
    map.eachLayer(layer => {
        if (layer instanceof L.Marker && layer !== userMarker) {
            map.removeLayer(layer);
        }
    });

    const redIcon = L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    pins.forEach(pin => {
        Pins[`${pin.lat},${pin.lng}`] = {
            audio_url: pin.audio_url,
            song: pin.song,
            artist: pin.artist,
            lastQueuedAt: 0
        };

        const marker = L.marker([pin.lat, pin.lng], { icon: redIcon }).addTo(map);

        marker.bindPopup(`
            <div class="popup-content">
                <b>${pin.artist}</b><br>
                <i>${pin.song}</i><br><br>
                <button class="popup-play-btn">Play</button>
                <button class="popup-queue-btn">Queue</button>
            </div>
        `);

        marker.on("popupopen", e => {
            const popup = e.popup.getElement();
            popup.querySelector(".popup-play-btn").onclick = () =>
                onPlay(pin.audio_url, pin.song, pin.artist);

            popup.querySelector(".popup-queue-btn").onclick = () =>
                onQueue(pin.audio_url, pin.song, pin.artist, false);
        });
    });
}
