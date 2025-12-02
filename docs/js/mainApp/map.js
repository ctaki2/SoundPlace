// map.js
import state from "./variables.js"
import { distanceMeters } from "./helper.js";
import { saveShareLoc } from "./saveInfo.js";

const shareLocationBtn = document.getElementById("shareLocBtn");
const FindMe = document.getElementById("FindMe");

let map, userMarker;
let autoCenterView = true;
// let share = true;
let locationInterval = null;
let userPosition = null;
let locationSharing = true;


export const Pins = {};

shareLocationBtn.onclick = () => {
    state.shareLoc = !state.shareLoc;
    locationSharing = state.shareLoc;
    // state.shareLoc = share;
    saveShareLoc()

    FindMe.style.display = state.shareLoc ? "block" : "none";

    if (state.shareLoc) {
        startLocationSharing();
    } else {
        stopLocationSharing();
    }
};


// ---------------------------------------------------------------
// INIT MAP
// ---------------------------------------------------------------
let globalOnQueue = null; // store callback

export function initMap({ onPlay, onQueue, socket }) {
    globalOnQueue = onQueue;

    map = L.map("map").setView([41.8781, -87.6298], 13);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        subdomains: "abcd",
        maxZoom: 19
    }).addTo(map);

    map.on("movestart", () => autoCenterView = false);

    
    if (FindMe) FindMe.onclick = centerMapOnUser;

    if (state.shareLoc){
    // Start sharing by default
        startLocationSharing();
    }

        // Try to load pins from server immediately (HTTP) in case socket doesn't emit
        fetch('/api/pins')
            .then(res => res.json())
            .then(pins => {
                if (Array.isArray(pins)) renderPins(pins, onPlay, onQueue);
            })
            .catch(() => {});

        // Also listen for realtime pin updates over socket
        socket.on("pins", pins => renderPins(pins, onPlay, onQueue));
}

// ---------------------------------------------------------------
// LOCATION SHARING
// ---------------------------------------------------------------
function startLocationSharing() {
    state.shareLoc = true;
    locationSharing = true;

    if (!locationInterval) {
        updateLocation(); // run once immediately
        locationInterval = setInterval(updateLocation, 3000);
    }
}


function stopLocationSharing() {
    state.shareLoc = false;
    locationSharing = false;

    // Stop interval
    if (locationInterval) {
        clearInterval(locationInterval);
        locationInterval = null;
    }

    // Remove marker from map
    if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
    }

    // Disable abilities
    userPosition = null;
    autoCenterView = false; // user isn't sharing, so do NOT center
}


// ---------------------------------------------------------------
// UPDATE LOCATION
// ---------------------------------------------------------------
function updateLocation() {

    if (!state.shareLoc) return;            // <-- prevents updates entirely
    if (!locationSharing) return;  // <-- safety check

    navigator.geolocation.getCurrentPosition(pos => {

        const { latitude, longitude } = pos.coords;
        userPosition = [latitude, longitude];

        // If marker doesn't exist → create
        if (!userMarker) {
            userMarker = L.circleMarker(userPosition, {
                radius: 8,
                fillColor: "#64c8ff",
                color: "#fff",
                weight: 2,
                fillOpacity: 1
            }).addTo(map);

            map.setView(userPosition, 15);
        } else {
            userMarker.setLatLng(userPosition);
        }

        // Only center if user hasn't manually moved
        if (autoCenterView) {
            map.setView(userPosition, 15);
        }

        // Still auto-queue only when sharing  
        autoQueueSong(latitude, longitude, globalOnQueue);

    }, console.error, { enableHighAccuracy: true });
}


// ---------------------------------------------------------------
// AUTO QUEUE SONG
// ---------------------------------------------------------------
function autoQueueSong(lat, lng, onQueue) {
    if (!onQueue) return;

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

// ---------------------------------------------------------------
function centerMapOnUser() {
    if (!locationSharing || !userPosition) return;
    map.setView(userPosition, 15);
}


// ---------------------------------------------------------------
function renderPins(pins, onPlay, onQueue) {
    map.eachLayer(layer => {
        if (layer instanceof L.Marker && layer !== userMarker) {
            map.removeLayer(layer);
        }
    });
    const genreIcons = {
        ' pop': L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        ' rock': L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        ' r&b': L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        ' electronic': L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        ' classical': L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        ' folk': L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        ' country': L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
}
    // const redIcon = L.icon({
    //     iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    //     shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    //     iconSize: [25, 41],
    //     iconAnchor: [12, 41],
    //     popupAnchor: [1, -34],
    //     shadowSize: [41, 41]
    // });

    pins.forEach(pin => {
        Pins[`${pin.lat},${pin.lng}`] = {
            audio_url: pin.audio_url,
            song: pin.song,
            artist: pin.artist,
            lastQueuedAt: 0
        };

        //const marker = L.marker([pin.lat, pin.lng], { icon: redIcon }).addTo(map);
        const icon = genreIcons[pin.genre.toLowerCase()] || genreIcons[' rock'];
        const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
        marker.bindPopup(`
            <div class="popup-content">
                <div class="popup-header">
                    <div class="popup-avatar">${pin.artist.charAt(0)}</div>
                    <div class="popup-artist">${pin.artist}</div>
                </div>
                <div class="popup-song">${pin.song}</div>
                <div class="popup-story"><em>${pin.story}<br></em></div> <!-- Added story display -->
                <div class="popup-actions">
                    <button class="popup-play-btn">
                        <span class="btn-icon">▶</span>
                        Play
                    </button>
                    <button class="popup-queue-btn">
                        <span class="btn-icon">⏭</span>
                        Queue
                    </button>
                </div>
            </div>
        `);

        marker.on("popupopen", e => {
            const popup = e.popup.getElement();
            popup.querySelector(".popup-play-btn").onclick =
                () => onPlay(pin.audio_url, pin.song, pin.artist);
            popup.querySelector(".popup-queue-btn").onclick =
                () => onQueue(pin.audio_url, pin.song, pin.artist, false);
        });
    });
}
