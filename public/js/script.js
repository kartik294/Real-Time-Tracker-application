const socket = io();
const markers = {};
const paths = {};

let username = prompt("Enter your name:");
socket.emit("set-username", username);

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      socket.emit("send-location", { latitude, longitude });
    },
    (error) => {
      console.error(error);
    },
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
  );
}

const map = L.map("map").setView([0, 0], 16);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Shreyians Coding School",
}).addTo(map);

socket.on("receive-location", (data) => {
  const { id, latitude, longitude, username } = data;

  if (!markers[id]) {
    markers[id] = L.marker([latitude, longitude]).addTo(map);
    markers[id].bindPopup(username || "Anonymous User").openPopup();
    paths[id] = L.polyline([]).addTo(map); // Initialize movement path
  } else {
    markers[id].setLatLng([latitude, longitude]);
    paths[id].addLatLng([latitude, longitude]); // Track movement history
  }

  map.setView([latitude, longitude], 16);
});

socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
    map.removeLayer(paths[id]);
    delete paths[id];
  }
});

// Listen for user list updates to show online/offline users
socket.on("user-list", (users) => {
  const userListElement = document.getElementById("userList");
  userListElement.innerHTML = "";
  users.forEach((user) => {
    const userItem = document.createElement("li");
    userItem.textContent = user.username;
    userListElement.appendChild(userItem);
  });
});
