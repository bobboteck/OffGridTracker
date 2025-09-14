// Inizializza la mappa
const map = L.map('map', {
  center: [41.8986, 12.4931], // Roma
  zoom: 10,
  zoomControl: true,
  attributionControl: true
});

// Carica i tile da locale (es. /tiles/{z}/{x}/{y}.png)
L.tileLayer('./tiles/{z}/{x}/{y}.png', {
  maxZoom: 16,
  minZoom: 8,
  tileSize: 256,
  errorTileUrl: '', // opzionale: tile di fallback
}).addTo(map);

// // Aggiunta marker al click
// map.on('click', function (e) {
//   const { lat, lng } = e.latlng;
//   //L.marker([lat, lng]).addTo(map).bindPopup(`Lat: ${lat.toFixed(5)}<br>Lng: ${lng.toFixed(5)}`).openPopup();
//   //L.marker([41.826727500879436, 12.563196001323092]).addTo(map).bindPopup(`Lat: ${(41.826727500879436).toFixed(5)}<br>Lng: ${(12.563196001323092).toFixed(5)}`).openPopup();

//     L.marker([lat, lng], {
//         icon: L.divIcon({
//             className: "custom-div-icon",
//             html: `
//             <div style="text-align: center;">
//                 <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png"><br>
//                 <span style="font-size: 12px;">sender</span>
//             </div>`,
//             iconSize: [25, 41],
//             iconAnchor: [12, 41]  // punta del marker
//         })
//     }).addTo(map);
// });
