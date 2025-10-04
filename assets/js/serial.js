/*
 * Name          : serial.js
 * @author       : Roberto D'Amico (Bobboteck - IU0PHY)
 * Last modified : 14.09.2025
 * Revision      : 1.1.6
 *
 * Modification History:
 * Date         Version     Modified By     Description
 * 2025-09-14   0.0.1       Roberto D'Amico First version
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
const autoScroll = true;

let connected = false;
let port;
let reader;
const stationsData = [];
const receivedJson = { "received": [] };

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

/**
 * Create a connection with selected serial port
 */
async function serialConnect()
{
    try
    {
        console.log("serialConnect ...");

        port = await navigator.serial.requestPort();
        await port.open({ baudRate: baudRate });

        connected = true;

        console.log("Port opened!");
    }
    catch(error)
    {
        console.log(error);
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
                            //console.log(element);
                            dataReceived = dataReceived + String.fromCharCode(element);
                            receivedData.value = receivedData.value + String.fromCharCode(element);
                            //console.log(dataReceived);
                        }
                        else
                        {
                            //console.log("---END MESSAGE---");
                            // receivedData.value = receivedData.value + dataReceived;
                            // receivedData.value = receivedData.value + "\n========\n";
                        }
                    });

                    // Check if Autoscroll is selected or not
                    if(autoScroll)
                    {
                        // Auto scroll down
                        receivedData.scrollTop = receivedData.scrollHeight;
                    }
                }

                console.log("Into while true");

                const match = dataReceived.match(pattern);
                if (match)
                {
                    // If the string match with pattern start decoding
                    decodeData(match);
            
                    // Rimuovi il messaggio processato dal buffer
                    dataReceived = dataReceived.slice(dataReceived.indexOf(fullMessage) + fullMessage.length);
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

navigator.serial.addEventListener("connect", (event) => 
{
    console.log("Event connected device");
});
  
navigator.serial.addEventListener("disconnect", (event) => 
{
    console.log("Event disconnect device");
});


/**
 * Decode all data sended via serial port from the gateway
 * @param {*} dataMatch 
 */
function decodeData(dataMatch)
{
    const fullMessage = dataMatch[0]; // Il messaggio completo
    const contenuto = dataMatch[1];   // Tutto quello tra <--- e / FreqErr
    const rssi = parseInt(dataMatch[2]);
    const snr = parseFloat(dataMatch[3]);
    const freqErr = parseInt(dataMatch[4]); // Il valore di FreqErr

    console.log("Messaggio completo:", fullMessage);
    console.log("Contenuto:", contenuto);
    console.log("RSSI:", rssi);
    console.log("SNR:", snr);
    console.log("FreqErr:", freqErr);

    let aprsPath = decodeAPRSPath(contenuto);   //TODO: Questo deve ritornare i dati decodificati

    // TODO: Sostituire il metodo decodeCoordinate con decodePayload
    let aprsPayload = decodePayload(aprsPath.payload);
    console.log("Payload decoded: ", aprsPayload);

    // TODO: Spostare qui la logica di gestione dei dati JSON

    const callSignReceived = receivedJson.received.find(s=>s.callSign === aprsPath.callSign);

    if(callSignReceived)
    {
        // Nominativo già presente, quindi aggiungere solo le informazioni nella sezione "data"
        const newData =
        {
            "from": aprsPath.from,
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

        console.log("Received JSON: ", receivedJson);
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
                    "from": aprsPath.from,
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

        console.log("Received JSON: ", receivedJson);
    }
}

/**
 * Decode APRS Data
 * @param {*} aprsData 
 */
function decodeAPRSPath(aprsData)
{
    let result = undefined;
    //const patternConent = /^([A-Z0-9\-]+)>([A-Z0-9]+),([A-Z0-9\-]+):(![^ ]+)\s+(.*)$/m;
    //const patternConent = /^([A-Z0-9\-]+)>([A-Z0-9]+)(?:,([A-Z0-9\-*,]+))?:(![^ ]+)\s+(.*)$/;
    //const patternConent = /^([A-Z0-9\-]+)>([A-Z0-9]+)(?:,([A-Z0-9\-*,]+))?:(!|=)([^ ]+)(\s+(.*))$/
    //const patternConent = /^([A-Z0-9\-]+)>([A-Z0-9]+)(?:,([A-Z0-9\-*,]+))?:([!=].*)$/;
    const patternConent = /^([A-Z0-9\-]+)>([A-Z0-9\-]+)(?:,([A-Z0-9\-*,]+))?:([!=].*)$/;

    let matchAprs = aprsData.match(patternConent);

    if (matchAprs)
    {
        const sender = matchAprs[1];     // Original sender of message
        const swtype = matchAprs[2];     // software type???
        const aprsPath = matchAprs[3];   // APRS Path
        const payload = matchAprs[4];   // Payload: Compressed position, other data and message
        //const message = matchAprs[5];    // Message

        console.log("Mittente:", sender);
        console.log("SWType:", swtype);
        console.log("Path APRS:", aprsPath);
        console.log("Payload:", payload);
        let coordinate = decodeCoordinate(payload);
        console.log("Coordinate - Latitudine: " + coordinate.latitudine + " --- Longitudine: " + coordinate.longitudine);
        //console.log("Messaggio:", message);


        // TODO: Sostituire il metodo decodeCoordinate con decodePayload
        let decoded = decodePayload(payload);
        console.log("decoded: ", decoded);


        const senderData = stationsData.find(obj => obj.callSign === sender);

        if (senderData)
        {
            console.log("Trovato:", senderData);
        }
        else
        {
            console.log("Non trovato");

            let iconChar = decodeIcon(payload);
            let receivedFrom = decodeAprsPath(aprsPath);

            const newStation = { callSign: sender, mapPosition: { lat: coordinate.latitudine, lon: coordinate.longitudine }, icon: iconChar, from: receivedFrom };
            stationsData.push(newStation);
            
            //L.marker([coordinate.latitudine, coordinate.longitudine]).addTo(map).bindPopup(sender);
            let marker = L.marker([coordinate.latitudine, coordinate.longitudine],
            {
                icon: L.divIcon({
                    className: "customMarker",
                    html: `
                    <div class="customMarkerContainer">
                        <img src="./icons/icon-${iconChar}-24-24.png"><br>
                        <span class="${receivedFrom == "" ? "customMarkerTextDirect" : "customMarkerText"}">${sender}</span>
                    </div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 24]  // punta del marker
                })
            }).addTo(map);
            console.log(marker);

            
            const newStationLi = document.createElement("li");
            newStationLi.textContent = sender;
            document.getElementById("heardStations").appendChild(newStationLi);

            console.log(stationsData);
        }


        /**********************************************/
        // New object manage
        result = 
        {
            "callSign": sender,
            "swhw": swtype,
            "from": aprsPath,
            "payload": payload
        };
        /**********************************************/
    }
    else
    {
        console.log("No CONTENT decode!");
    }

    return result;
}

function decodeCoordinate(positionData)
{
    //"!L9=#_QZ:va";
    let latString = positionData.substring(2,6);
    console.log("Latitude string:", latString);
    
    let sommaLat = 0;
    const potenzaLat = latString.length - 1;

    for(i=0;i<latString.length;i++)
    {
        sommaLat += (latString.charCodeAt(i)-33)*91**(potenzaLat-i);
    }
    console.log("Somma:", sommaLat);
    let latitude = 90-(sommaLat/380926);
    console.log("Latitudine:", latitude);
    


    let lonString = positionData.substring(6,10);
    console.log("Longitude string:", lonString);

    let sommaLon = 0;
    const potenzaLon = lonString.length - 1;

    for(i=0;i<lonString.length;i++)
    {
        sommaLon += (lonString.charCodeAt(i)-33)*91**(potenzaLon-i);
    }
    console.log("Somma:", sommaLon);
    let longitude = -180+(sommaLon/190463);
    console.log("Longitude:", longitude);

    return { latitudine: latitude, longitudine: longitude };
}

function decodeIcon(positionData)
{
    let iconChar = positionData.charAt(positionData.length-1);

    //TODO: Find a better solution :D
    if(iconChar != 'a' && iconChar != '&' && iconChar != '#' && iconChar != '_')
    {
        iconChar = "default";
    }

    return iconChar;
}

function decodeAprsPath(pathAprs)
{
    let repeter = "";

    if(pathAprs.charAt(pathAprs.length-1) == '*')
    {
        repeter = pathAprs.substring(0, pathAprs.length-1);
    }

    return repeter;
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

    return { dataType: dataType, overlay: overlay, 
        simbleTable: simbleTable, latitude: latitude, longitude: longitude, icon: icon, 
        direction: direction, speed: speed, altitude: altitude, compressionType: compressionType, message: message };
}

function decodeLatitude(codedLatitude)
{
    //let latString = positionData.substring(2,6);
    //console.log("Latitude string:", codedLatitude);
    let resultLatitude = 0;
    let sommaLat = 0;
    const potenzaLat = codedLatitude.length - 1;

    for(i=0;i<codedLatitude.length;i++)
    {
        sommaLat += (codedLatitude.charCodeAt(i)-33)*91**(potenzaLat-i);
    }

    //console.log("Somma:", sommaLat);
    resultLatitude = 90-(sommaLat/380926);
    //console.log("Latitudine:", latitude);
    return resultLatitude;
}

function decodeLongitude(codedLongitude)
{
    //let lonString = positionData.substring(6,10);
    //console.log("Longitude string:", codedLongitude);
    let resultLongitude = 0;
    let sommaLon = 0;
    const potenzaLon = codedLongitude.length - 1;

    for(i=0;i<codedLongitude.length;i++)
    {
        sommaLon += (codedLongitude.charCodeAt(i)-33)*91**(potenzaLon-i);
    }
    //console.log("Somma:", sommaLon);
    resultLongitude = -180+(sommaLon/190463);
    //console.log("Longitude:", longitude);
    return resultLongitude;
}