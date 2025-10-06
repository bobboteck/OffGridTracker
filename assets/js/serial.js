/*
 * Name          : serial.js
 * @author       : Roberto D'Amico (Bobboteck - IU0PHY)
 * Last modified : 06.10.2025
 * Revision      : 0.2.0
 *
 * Modification History:
 * Date         Version     Modified By     Description
 * 2025-09-14   0.0.1       Roberto D'Amico First version
 * 2025-10-05   0.1.0       Roberto D'Amico Refactoring and new data structure
 * 2025-10-06   0.2.0       Roberto D'Amico UI improvements
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
const baudRate = 115200;
const receivedJson = { "received": [] };

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

// Add event function on serialConnectButton click
serialConnectButton.addEventListener('click', async () => 
{
    console.log("Evento - serialConnectButton");

    if (navigator.serial)
    {
        if(baudRate > 0 && !connected)
        {
            serialConnect().then(() =>
            {
                serialConnectButton.innerText = "Disconnect";
                serialConnectButton.classList.remove("btn-success");
                serialConnectButton.classList.add("btn-outline-success");

                readUntilNotClose();
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
    }
}

/**
 * Read the data and write it in to the text area
 */
async function readUntilNotClose()
{
    while(port.readable && connected)
    {
        try
        {
            console.log("readUntilNotClose ...");

            reader = port.readable.getReader();

            let dataReceived = "";
            const pattern = /<--- LoRa Packet Rx : (.*?)\s*\(RSSI:([+-]?\d+)\s*\/\s*SNR:([+-]?\d+(?:\.\d+)?)\s*\/\s*FreqErr:([+-]?\d+)\)/;

            // Listen to data coming from the serial device.
            while (true) 
            {
                const { value, done } = await reader.read();
                if (done) 
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
                    decodeReceivedData(match);
            
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
            console.log("CATCH");
            console.log(error);
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


/**
 * Decode all data sended via serial port from the gateway
 * @param {*} dataMatch 
 */
function decodeReceivedData(dataMatch)
{
    const contenuto = dataMatch[1];         // Tutto quello tra <--- e / FreqErr
    const rssi = parseInt(dataMatch[2]);
    const snr = parseFloat(dataMatch[3]);
    const freqErr = parseInt(dataMatch[4]); // Il valore di FreqErr

    // Decodifica mittente e path
    const aprsPath = decodeAPRSPath(contenuto);
    // Decodifica il payload del messaggio ricevuto
    const aprsPayload = decodePayload(aprsPath.payload);

    // Cerca il nominativo per vedere se è già presente nei dati
    const callSignReceived = receivedJson.received.find(s=>s.callSign === aprsPath.callSign);

    if(callSignReceived)
    {
        // Nominativo già presente, quindi aggiungere solo le informazioni nella sezione "data"
        const newData =
        {
            "from": utilityPathFrom(aprsPath.from),
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
            "time": Date.now()
        };

        callSignReceived.data.push(newData);

        addStationOnMap(callSignReceived);

        console.log("Received new data JSON: ", receivedJson);
    }
    else
    {
        // Nominativo non presente, inserire tutti i dati
        const newStationData =
        {
            "callSign": aprsPath.callSign,
            "swhw": aprsPath.swhw,
            "dataType": aprsPayload.dataType,
            "overlay": aprsPayload.overlay,
            "simbleTable": aprsPayload.simbleTable,
            "data":
            [
                {
                    "from": utilityPathFrom(aprsPath.from),
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
                    "time": Date.now()
                }
            ]
        };

        receivedJson.received.push(newStationData);

        addStationOnMap(newStationData);

        console.log("Received new station JSON: ", receivedJson);

        // TODO: TEMPoraneally add station on list
        const newStationLi = document.createElement("li");
        newStationLi.textContent = aprsPath.callSign;
        document.getElementById("heardStations").appendChild(newStationLi);
    }

    showStationOnList();
}

/**
 * Decode APRS Data
 * @param {*} aprsData 
 */
function decodeAPRSPath(aprsData)
{
    let result = undefined;
    const patternConent = /^([A-Z0-9\-]+)>([A-Z0-9\-]+)(?:,([A-Z0-9\-*,]+))?:([!=].*)$/;

    let matchAprs = aprsData.match(patternConent);

    if (matchAprs)
    {
        const sender = matchAprs[1];    // Original sender of message
        const swtype = matchAprs[2];    // software type???
        const aprsPath = matchAprs[3];  // APRS Path
        const payload = matchAprs[4];   // Payload: Compressed position, other data and message

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
        console.log("No CONTENT decode!");
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


function utilityPathFrom(pathAprs)
{
    let repeter = "";

    if(pathAprs.charAt(pathAprs.length-1) == '*')
    {
        repeter = pathAprs.substring(0, pathAprs.length-1);
    }

    return repeter;
}

function utilityPopUpData(stationData)
{
    let viewData = "Last received<br />";

    const date = new Date(stationData.data[stationData.data.length-1].time);

    viewData += "Time: " + date.toLocaleDateString() + "(" + date.toISOString() + ")<br />";

    // TODO: Add other info

    return viewData;
}


function addStationOnMap(stationData)
{
    //<img src="./icons/icon-${stationData.data[stationData.data.length-1].payload.icon}-24-24.png"><br>

    L.marker([stationData.data[stationData.data.length-1].payload.lat, stationData.data[stationData.data.length-1].payload.lon],
    {
        icon: L.divIcon({
            className: "customMarker",
            html: `
            <div class="customMarkerContainer">
                <img src="./icons/icon-default-24-24.png"><br>
                <span class="${stationData.data[stationData.data.length-1].from == "" ? "customMarkerTextDirect" : "customMarkerText"}">${stationData.callSign}</span>
            </div>`,
            iconSize: [26,41],
            iconAnchor: [12,40],
            popupAnchor: [0,-30]
            // iconSize: [24, 24],
            // iconAnchor: [12, 24]  // punta del marker
        })
    }).addTo(map).bindPopup(utilityPopUpData(stationData));
}

function showStationOnList()
{
    // TODO: Show data updated on list
}