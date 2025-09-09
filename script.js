// Inizializza la mappa
const map = L.map('map', {
  center: [45.4642, 9.1900], // Milano (esempio)
  zoom: 13,
  zoomControl: true,
  attributionControl: false
});

// Carica i tile da locale (es. /tiles/{z}/{x}/{y}.png)
L.tileLayer('./tiles/{z}/{x}/{y}.png', {
  maxZoom: 18,
  minZoom: 10,
  tileSize: 256,
  errorTileUrl: '', // opzionale: tile di fallback
}).addTo(map);

// // Aggiunta marker al click
// map.on('click', function (e) {
//   const { lat, lng } = e.latlng;
//   L.marker([lat, lng]).addTo(map)
//     .bindPopup(`Lat: ${lat.toFixed(5)}<br>Lng: ${lng.toFixed(5)}`)
//     .openPopup();
// });
