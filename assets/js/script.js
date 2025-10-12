/*
 * Name          : script.js
 * @author       : Roberto D'Amico (Bobboteck - IU0PHY)
 * Last modified : 12.10.2025
 * Revision      : 0.3.0
 *
 * This file is part of : OffGridTracker project [https://github.com/bobboteck/OffGridTracker/]
 *
 * Modification History:
 * Date         Version     Modified By     Description
 * 2025-09-14   0.0.1       Roberto D'Amico First version
 * 2025-10-05   0.1.0       Roberto D'Amico Refactoring and new data structure
 * 2025-10-06   0.2.0       Roberto D'Amico UI improvements
 * 2025-10-12   0.3.0       Roberto D'Amico UI improvements in list stations
 * 
 * The MIT License (MIT)
 *
 * This file is part of the OffGridTracker project [https://github.com/bobboteck/OffGridTracker/].
 * Copyright (c) 2025 Roberto D'Amico (Bobboteck - IU0PHY).
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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

const debugCheckElement = document.getElementById("debugCheck");
debugCheckElement.addEventListener("change", () =>
{
    if (debugCheckElement.checked)
    {
        document.getElementById("debugColumn").style.display = "";
        document.getElementById("stationsColums").classList.replace("col-5","col-2");
    }
    else
    {
        document.getElementById("debugColumn").style.display = "none";
        document.getElementById("stationsColums").classList.replace("col-2","col-5");
    }
});