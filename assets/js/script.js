/*
 * Name          : script.js
 * @author       : Roberto D'Amico (Bobboteck - IU0PHY)
 * Last modified : 14.11.2025
 * Revision      : 0.5.0
 *
 * This file is part of : OffGridTracker project [https://github.com/bobboteck/OffGridTracker/]
 *
 * Modification History:
 * Date         Version     Modified By     Description
 * 2025-09-14   0.0.1       Roberto D'Amico First version
 * 2025-10-05   0.1.0       Roberto D'Amico Refactoring and new data structure
 * 2025-10-06   0.2.0       Roberto D'Amico UI improvements
 * 2025-10-12   0.3.0       Roberto D'Amico UI improvements in list stations
 * 2025-11-14   0.4.0       Roberto D'Amico Added tracking feature
 * 2025-11-17   0.5.0       Roberto D'Amico Unified js files
 * 2025-11-18   0.6.0       Roberto D'Amico Always highlights the stations listened to, at least once, direct
 * 2025-12-31   0.7.0       Roberto D'Amico Add settings panel and save info to local storage
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

const serialConnectButton = document.getElementById("serial_connect");
const debugCheckElement = document.getElementById("debugCheck");
const settingMapCenterLat = document.getElementById("mapCenterLatSetting");
const settingMapCenterLon = document.getElementById("mapCenterLonSetting");
const settingCallsign = document.getElementById("callsignSetting");

const baudRate = 115200;
const receivedJson = { "received": [] };

let appConfiguration = { call: "", mapCenter: { lat: 41.8986, lng: 12.4931 }};
let connected = false;
let port;
let reader;


serialConnectButton.disabled = true;
// Check i f browser support the 'Web Serial API'
if ("serial" in navigator) 
{
    // Enable controls
    serialConnectButton.disabled = false;
}
else
{
    // Disable the connect button
    serialConnectButton.disabled = true;
    // Message for the user
    alert("Sorry, but your browser not support 'Web Serial API', try with Chrome, Edge or other browse that support it");
}

//#region MAP Inizialize
appConfiguration = appSettingsLoad();
settingMapCenterLat.value = appConfiguration.mapCenter.lat;
settingMapCenterLon.value = appConfiguration.mapCenter.lng;
settingCallsign.value = appConfiguration.call;

// Initialize the Map
const map = L.map('map', {
  center: [appConfiguration.mapCenter.lat, appConfiguration.mapCenter.lng],
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
//#endregion

//#region Event Handlers
/**
 * Event of debug toggle change the view of page elements
 */
debugCheckElement.addEventListener("change", () =>
{
    if(debugCheckElement.checked)
    {
        document.getElementById("mapColumns").classList.replace("col-9","col-7");
        document.getElementById("debugColumns").style.display = "";
        document.getElementById("stationsColumns").classList.replace("col-3","col-2");
    }
    else
    {
        document.getElementById("mapColumns").classList.replace("col-7","col-9");
        document.getElementById("debugColumns").style.display = "none";
        document.getElementById("stationsColumns").classList.replace("col-2","col-3");
    }
});

/**
 * Add event function on serialConnectButton click
 */
serialConnectButton.addEventListener('click', async () => 
{
    console.log("Evento - serialConnectButton");

    if(navigator.serial)
    {
        if(baudRate > 0 && !connected)
        {
            serialConnect().then(() =>
            {
                serialConnectButton.innerText = "Disconnect";
                serialConnectButton.classList.remove("btn-success");
                serialConnectButton.classList.remove("btn-danger");
                serialConnectButton.classList.add("btn-outline-success");

                readUntilNotClose();
            })
            .catch((error) =>
            {
                serialConnectButton.innerText = "Connect";
                serialConnectButton.classList.remove("btn-success");
                serialConnectButton.classList.add("btn-danger");

                alert("Serial connection error:", error);
            });
        }
        else
        {
            console.log("Tentativo di chiusura");
            connected = false;
            console.log("Tentativo di chiusura - Prima di reader.cancel");
            reader.cancel();
            console.log("Tentativo di chiusura - Dopo di reader.cancel");
            // Allow the serial port to be closed
            reader.releaseLock();
            // Close serial port
            await port.close();
            console.log("Tentativo di chiusura - Dopo di await port.close");

            serialConnectButton.innerText = "Connect";
            serialConnectButton.classList.add("btn-success");
            serialConnectButton.classList.remove("btn-outline-success");
        }
    }
});


navigator.serial.addEventListener("connect", (event) => 
{
    console.log("Event connected device");
});


navigator.serial.addEventListener("disconnect", (event) => 
{
    console.log("Event disconnect device");
});

/**
 * Update the fields that contain the center position of Map at the Start, but not save it!
 */
document.getElementById("currentMapCenter").addEventListener("click", () =>
{
    const center = map.getCenter();

    appConfiguration.mapCenter.lat = center.lat.toFixed(4);
    appConfiguration.mapCenter.lng = center.lng.toFixed(4);

    settingMapCenterLat.value = appConfiguration.mapCenter.lat;
    settingMapCenterLon.value = appConfiguration.mapCenter.lng;
});

/**
 * Save application settings to local storage
 */
document.getElementById("saveSettings").addEventListener("click", () =>
{
    if(appConfiguration.mapCenter.lat !== settingMapCenterLat.value)
    {
        appConfiguration.mapCenter.lat = settingMapCenterLat.value;
    }

    if(appConfiguration.mapCenter.lng !== settingMapCenterLon.value)
    {
        appConfiguration.mapCenter.lng = settingMapCenterLon.value;
    }

    appConfiguration.call = settingCallsign.value;

    appSettingsSave();

    bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasSettings')).hide();
});
//#endregion

//#region Serial connection and receive data
/**
 * Create a connection with selected serial port
 */
async function serialConnect()
{
    try
    {
        console.log("SerialConnect ...");

        port = await navigator.serial.requestPort();
        await port.open({ baudRate: baudRate });

        connected = true;

        console.log("... Port opened!");
    }
    catch(error)
    {
        console.log("SerialConnect - ERROR: ", error);
        throw error;
    }
}

/**
 * Read the data and check
 */
async function readUntilNotClose()
{
    const pattern = /<--- LoRa Packet Rx : (.*?)\s*\(RSSI:([+-]?\d+)\s*\/\s*SNR:([+-]?\d+(?:\.\d+)?)\s*\/\s*FreqErr:([+-]?\d+)\)/;

    while(port.readable && connected)
    {
        console.log("readUntilNotClose ...");

        try
        {
            let dataReceived = "";

            reader = port.readable.getReader();

            // Listen to data coming from the serial device.
            while(true)
            {
                const { value, done } = await reader.read();

                if(done)
                {
                    console.log("DONE");
                    // Allow the serial port to be closed
                    reader.releaseLock();
                    break;
                }
                else
                {
                    // Show in text area each char received
                    value.forEach(element =>
                    {
                        // The sequence of chars 13 and 10, insert a blank row in text area, this control is for skipping the 13 char and not have the blank row
                        if(element !== 13)
                        {
                            dataReceived = dataReceived + String.fromCharCode(element);
                            receivedData.value = receivedData.value + String.fromCharCode(element);
                        }
                        else
                        {
                            //console.log("---END MESSAGE---");
                            // receivedData.value = receivedData.value + dataReceived;
                            // receivedData.value = receivedData.value + "\n========\n";
                        }
                    });

                    // Auto scroll down
                    receivedData.scrollTop = receivedData.scrollHeight;
                }

                // Check if data received match with pattern
                const match = dataReceived.match(pattern);
                if (match)
                {
                    // If the string match with pattern start decoding
                    decodeShowData(match);
                    // Rimuovi il messaggio processato dal buffer
                    dataReceived = dataReceived.slice(dataReceived.indexOf(match[0]) + match[0].length);
                }
                else
                {
                    //console.log("No pattern match!");
                }
            }
        }
        catch(error)
        {
            console.log("CATCH", error);
        }
        finally
        {
            console.log("FINALLY");
            // Allow the serial port to be closed
            reader.releaseLock();
        }
    }

    console.log("Disconnesso!");
}
//#endregion



/**
 * Decode all data sended via serial port from the gateway
 * @param {*} dataMatch An array of data received that match with the pattern
 */
function decodeShowData(dataMatch)
{
    const timeStamp = Date.now();
    const contenuto = dataMatch[1];         // All message part between <--- and / FreqErr
    const rssi = parseInt(dataMatch[2]);    // The value of RSSI
    const snr = parseFloat(dataMatch[3]);   // The value of SNR
    const freqErr = parseInt(dataMatch[4]); // The value of Frequency Error

    // Decode the APRS message
    const aprsData = decodeAPRSData(contenuto);
    // Decode the payload of APRS message received
    const aprsPayload = decodePayload(aprsData.payload);
    // Get the path from of the message
    const from = utilityPathFrom(aprsData.from);

    // Find the Callsign into the JSON data object, to check if need to be updated or added
    const callSignReceived = receivedJson.received.find(s=>s.callSign === aprsData.callSign);
    // If the Callsign is present, add only the new data to the data array, otherwise add all the information to the object
    if(callSignReceived)
    {
        // Remove the old Marker from the Map
        removeStationOnMap(callSignReceived);
        // Add new Marker to the Map
        const mapMarker = addStationOnMap(aprsPayload.latitude, aprsPayload.longitude, aprsData.callSign, from, rssi, snr, timeStamp);

        // Nominativo già presente, quindi aggiungere solo le informazioni nella sezione "data"
        const newData =
        {
            "from": from,
            "distance": from === "" ? getDistanceFromLatLonInKm(aprsPayload.latitude, aprsPayload.longitude, 41.94435099682926, 12.517065247376257) : null, //TODO: La distanza deve essere dinamica!!!
            "payload":
            {
                "lat": aprsPayload.latitude,
                "lon": aprsPayload.longitude,
                "icon": aprsPayload.icon,
                "direction": aprsPayload.direction,
                "speed": aprsPayload.speed,
                "altitude": aprsPayload.altitude,
                "compressionType": aprsPayload.compressionType,
                "messagge": aprsPayload.message
            },
            "rssi": rssi,
            "snr": snr,
            "frequencyError": freqErr,
            "marker": mapMarker,
            "time": timeStamp
        };

        // Aggiorna le informazioni nell'oggetto di persistenza
        callSignReceived.data.push(newData);

        addStationTrackOnMap(callSignReceived);

        console.debug("Received new data JSON: ", receivedJson);
    }
    else
    {
        // Aggiunge il marker sulla mappa
        const mapMarker = addStationOnMap(aprsPayload.latitude, aprsPayload.longitude, aprsData.callSign, from, rssi, snr, timeStamp);
        // Nominativo non presente, crea il nuovo item con tutti i dati nell'oggetto di persistenza
        const newStationData =
        {
            "callSign": aprsData.callSign,
            "swhw": aprsData.swhw,
            "dataType": aprsPayload.dataType,
            "overlay": aprsPayload.overlay,
            "simbleTable": aprsPayload.simbleTable,
            "data":
            [
                {
                    "from": from,
                    "distance": from === "" ? getDistanceFromLatLonInKm(aprsPayload.latitude,aprsPayload.longitude,41.94435099682926, 12.517065247376257) : null, //TODO: La distanza deve essere dinamica!!!
                    "payload":
                    {
                        "lat": aprsPayload.latitude,
                        "lon": aprsPayload.longitude,
                        "icon": aprsPayload.icon,
                        "direction": aprsPayload.direction,
                        "speed": aprsPayload.speed,
                        "altitude": aprsPayload.altitude,
                        "compressionType": aprsPayload.compressionType,
                        "messagge": aprsPayload.message
                    },
                    "rssi": rssi,
                    "snr": snr,
                    "frequencyError": freqErr,
                    "marker": mapMarker,
                    "time": timeStamp
                }
            ]
        };

        // Aggiunge le informazioni nell'oggetto di persistenza
        receivedJson.received.push(newStationData);

        console.debug("Received new station JSON: ", receivedJson);
    }

    showStationOnList();
}
 
/**
 * Decode APRS Data
 * @param {*} aprsData 
 */
function decodeAPRSData(aprsData)
{
    let result = undefined;
    const patternConent = /^([A-Z0-9\-]+)>([A-Z0-9\-]+)(?:,([A-Z0-9\-*,]+))?:([!=].*)$/;

    let matchAprs = aprsData.match(patternConent);

    if (matchAprs)
    {
        const sender = matchAprs[1];    // Original sender of message
        const swtype = matchAprs[2];    // System type???
        const aprsPath = matchAprs[3];  // APRS Path
        const payload = matchAprs[4];   // Payload: Compressed position, other data and message

        console.log(">>> decodeAPRSData: ", aprsData);
        console.log(">>> payload: ", payload);

        // New object manage
        result = 
        {
            "callSign": sender,
            "swhw": swtype,
            "from": aprsPath,
            "payload": payload
        };
    }
    else
    {
        console.debug("No CONTENT decode!");
    }

    return result;
}

function decodePayload(payload)
{
    //  =/9;T)Q\qQ[>jQ  --- Tracker
    //  !L9;WjQ]&Da     --- Gateway
    
    const dataType = payload.substring(0,1);
    let overlay = "";
    let simbleTable = "";
    const latitude = decodeLatitude(payload.substring(2,6));
    const longitude = decodeLongitude(payload.substring(6,10));
    const icon = payload.substring(10,11);
    let direction = "";
    let speed = "";
    let altitude = "";
    let compressionType = "";
    let message = "";

    if(dataType === "!")
    {
        // Gateway
        overlay = payload.substring(1,2);
        message = payload.substring(12,payload.length);
    }
    else if(dataType === "=")
    {
        // Tracker
        simbleTable = payload.substring(1,2);
        message = payload.substring(14,payload.length);
    }
    else
    {
        console.log("Not managed data type: ", payload);
    }

    return { dataType: dataType, overlay: overlay, simbleTable: simbleTable, latitude: latitude, longitude: longitude, icon: icon, 
            direction: direction, speed: speed, altitude: altitude, compressionType: compressionType, message: message };
}

/**
 * Decode compressed Base91 Latitude to number
 * @param {string} codedLatitude 
 * @returns {number} The Latitude
 */
function decodeLatitude(codedLatitude)
{
    let resultLatitude = 0;
    let sommaLat = 0;
    const potenzaLat = codedLatitude.length - 1;

    for(i=0;i<codedLatitude.length;i++)
    {
        sommaLat += (codedLatitude.charCodeAt(i)-33)*91**(potenzaLat-i);
    }

    resultLatitude = 90-(sommaLat/380926);

    return resultLatitude;
}

function decodeLongitude(codedLongitude)
{
    let resultLongitude = 0;
    let sommaLon = 0;
    const potenzaLon = codedLongitude.length - 1;

    for(i=0;i<codedLongitude.length;i++)
    {
        sommaLon += (codedLongitude.charCodeAt(i)-33)*91**(potenzaLon-i);
    }

    resultLongitude = -180+(sommaLon/190463);

    return resultLongitude;
}

/**
 * Estrae l'informazione del relay del messaggio
 * @param {*} pathAprs Path APRS del messaggio
 * @returns Se presente restituisce il call della stazione che ha ripetuto i lmessaggio, altrimenti stringa vuota per i messaggi diretti
 */
function utilityPathFrom(pathAprs)
{
    let repeter = "";

    console.debug(">>> utilityPathFrom:", pathAprs);

    if(pathAprs.charAt(pathAprs.length-1) == '*')
    {
        repeter = pathAprs.substring(0, pathAprs.length-1);
    }

    return repeter;
}

function utilityPopUpData(from, rssi, snr, timeStamp)
{
    const date = new Date(timeStamp);

    const viewData = `<table><tr><th>Path:</th><td>${from}</td></tr><tr><th>RSSI:</th><td>${rssi}</td></tr><tr><th>SNR:</th><td>${snr}</td></tr><tr><th>Time:</th><td>${date.toISOString()}</td></tr></table>`;

    return viewData;
}


/**
 * Aggiunge una Stazione e i sui dati alla Mappa
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {string} call 
 * @param {string} path 
 * @param {number} time 
 * @returns 
 */
function addStationOnMap(latitude, longitude, call, path, rssi, snr, time)
{
    const markerAdded = L.marker([latitude, longitude],
    {
        icon: L.divIcon({
            className: "customMarker",
            html: `
            <div class="customMarkerContainer">
                <img src="./icons/icon-default-24-24.png"><br>
                <span class="${path == "" ? "customMarkerTextDirect" : "customMarkerText"}">${call}</span>
            </div>`,
            iconSize: [26,41],
            iconAnchor: [40,41],
            popupAnchor: [1,-39]
        })
    }).addTo(map).bindPopup(utilityPopUpData(path, rssi, snr,time));

    return markerAdded;
}

/**
 * Rimuove il Marker precedente di una Stazione già presente nella Mappa
 * @param {*} receivedData I dati APRS ricevuti ed elaborati
 */
function removeStationOnMap(receivedData)
{
    // Verifica che l'oggetto data della stazione identificata contenga informazioni per identificare il Marker da rimuovere
    if(receivedData.data.length > 0)
    {
        // Recupera dall'array dei data l'ultimo Marker inserito nella mappa
        const oldMapMarker = receivedData.data[receivedData.data.length-1].marker;
        // Rimuove il Marker
        map.removeLayer(oldMapMarker);
        // TODO: Rimuovere informazione di DEBUG
        console.debug("Rimosso marker di: ", receivedData.callSign);
    }
}

/**
 * Aggiunge sulla mappa la linea che collega la posizione precedente all'attuale e il circle con popup nella posizione precedente
 * @param {*} stationData 
 */
function addStationTrackOnMap(stationData)
{
    const lastLat = stationData.data[stationData.data.length-1].payload.lat;
    const lastLon = stationData.data[stationData.data.length-1].payload.lon;
    const prevLat = stationData.data[stationData.data.length-2].payload.lat;
    const prevLon = stationData.data[stationData.data.length-2].payload.lon;

    // Aggiunge la traccia solo se le coordinate sono diverse. NOTA: Si potrebbero filtrare anche i mini spostamenti per non riempire la mappa di tracce inutili!
    if(prevLat !== lastLat && prevLon !== lastLon)
    {
        // Sequenza di coordinate geografiche (latitudine, longitudine) per definire i punti della traccia
        const trackSection =
        [
            [prevLat, prevLon],
            [lastLat, lastLon]
        ];

        console.debug(`${stationData.callSign} === ${trackSection}`);

        // Disegna la linea sulla mappa
        const polyline = L.polyline(trackSection,
        {
            color: 'blue',
            weight: 5,
            opacity: 0.7,
            smoothFactor: 1
        }).addTo(map);

        // Converte il timestamp in data
        const date = new Date(stationData.data[stationData.data.length-2].time);

        L.circleMarker([prevLat, prevLon], { radius: 2, color: 'red' })
        .addTo(map)
        .bindPopup(`<table><tr><th>Path:</th><td>${stationData.data[stationData.data.length-2].from}</td></tr><tr><th>RSSI:</th><td>${stationData.data[stationData.data.length-2].rssi}</td></tr><tr><th>SNR:</th><td>${stationData.data[stationData.data.length-2].snr}</td></tr><tr><th>Time:</th><td>${date.toISOString()}</td></tr></table>`);
    }
}

function rsiiImage(rssiValue)
{
    let fileName = "";

    if(rssiValue > -90)
    {
        fileName = "rssi-90.svg";
    }
    else if(rssiValue <= -90 && rssiValue > -100)
    {
        fileName = "rssi-100.svg";
    }
    else if(rssiValue <= -100 && rssiValue > -110)
    {
        fileName = "rssi-110.svg";
    }
    else if(rssiValue <= -110 && rssiValue > -120)
    {
        fileName = "rssi-120.svg";
    }
    else if(rssiValue <= -120)
    {
        fileName = "rssi-120.svg";
    }

    return fileName;
}


function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180)
}

function showStationOnList()
{
    // Update the stations received counter
    document.getElementById("stationNumber").innerText = ` (${receivedJson.received.length})`;

    // Get element that contain list
    const listElement = document.getElementById("accordionReceived");
    listElement.innerHTML = "";
    // Show data updated on list for each Station received and decoded
    receivedJson.received.forEach(station =>
    {
        const call = station.callSign;
        const rssiValue = station.data[station.data.length-1].rssi;
        const snrValue =  station.data[station.data.length-1].snr;
        const from = station.data[station.data.length-1].from;
        
        // Count the time station was recaived directly
        let directCounter = 0;
        for (const item of station.data)
        {
            // Check if direct received and update counter
            if (item.from === "")
            {
                directCounter++;
            }
        }

        const stationHtml = `
<div class="accordion-item">
    <h2 class="accordion-header" id="heading_${call}">
        <button class="accordion-button accordionButtunCall collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_${call}" aria-expanded="false" aria-controls="collapse_${call}">
            <div class="container">
                <div class="row">
                    <div class="col-5 ${directCounter > 0 ? " stationBold" : ""}" style="padding:0 5px">${call}</div>
                    <div class="col-2">
                        <span class="badge badgeCall text-bg-success">${station.data.length}</span>
                    </div>
                    <div class="col-2">
                        <img src="./assets/images/${rsiiImage(rssiValue)}" alt="${rssiValue}" title="RSSI: ${rssiValue} - SNR: ${snrValue}" />
                    </div>
                    <div class="col-3">${from === "" ? station.data[station.data.length-1].distance.toFixed(2) : "&nbsp;"}</div>
                </div>
            </div>
        </button>
    </h2>
    <div id="collapse_${call}" class="accordion-collapse collapse" aria-labelledby="heading_${call}" data-bs-parent="#accordionReceived">
        <div class="accordion-body">
            <div>From: ${from}</div>
            <div>Message: ${station.data[station.data.length-1].payload.messagge}</div>
            <div>Direct received: ${directCounter}/${station.data.length}</div>
        </div>
    </div>
</div>`;

        listElement.innerHTML += stationHtml;
    })
}

function appSettingsSave()
{
    localStorage.setItem("OffGridTracker-Settings", JSON.stringify(appConfiguration));
}

function appSettingsLoad()
{
    return JSON.parse(localStorage.getItem("OffGridTracker-Settings"));
}