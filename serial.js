const serialConnectButton = document.getElementById("serial_connect");
const baudRate = 115200;
const autoScroll = true;

let connected = false;
let port;
let reader;
const stationsData = [];

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
                // baudRateSelection.disabled = true;
                // textToSend.disabled = false;
                // sendButton.disabled = false;

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
            // baudRateSelection.disabled = false;
            // textToSend.disabled = true;
            // sendButton.disabled = true;
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
            //const pattern = /<--- (.*?) \/ FreqErr:([+-]?\d+)\)/s;
            //const pattern = /<--- LoRa Packet Rx : (.*?) \/ FreqErr:([+-]?\d+)\)/s;
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
                    const fullMessage = match[0]; // Il messaggio completo
                    const contenuto = match[1];   // Tutto quello tra <--- e / FreqErr
                    const rssi = parseInt(match[2]);
                    const snr = parseFloat(match[3]);
                    const freqErr = parseInt(match[4]); // Il valore di FreqErr
            
                    console.log("Messaggio completo:", fullMessage);
                    console.log("Contenuto:", contenuto);
                    decodeContent(contenuto);
                    console.log("RSSI:", rssi);
                    console.log("SNR:", snr);
                    console.log("FreqErr:", freqErr);
            
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




async function decodeContent(contentData)
{
    //const patternConent = /^([A-Z0-9\-]+)>([A-Z0-9]+),([A-Z0-9\-]+):(![^ ]+)\s+(.*)$/m;
    const patternConent = /^([A-Z0-9\-]+)>([A-Z0-9]+)(?:,([A-Z0-9\-*,]+))?:(![^ ]+)\s+(.*)$/;
    let matchContent = contentData.match(patternConent);

    if (matchContent)
    {
        const sender = matchContent[1];     // Original sender of message
        const swtype = matchContent[2];     // software type???
        const aprsPath = matchContent[3];   // APRS Path
        const position = matchContent[4];   // Compressed position
        const message = matchContent[5];    // Message

        console.log("Mittente:", sender);
        console.log("SWType:", swtype);
        console.log("Path APRS:", aprsPath);
        console.log("Posizione:", position);
        let coordinate = decodeCoordinate(position);
        console.log("Coordinate - Latitudine: " + coordinate.latitudine + " --- Longitudine: " + coordinate.longitudine);
        console.log("Messaggio:", message);

        const senderData = stationsData.find(obj => obj.callSign === sender);

        if (senderData)
        {
            console.log("Trovato:", senderData);
        }
        else
        {
            console.log("Non trovato");

            const newStation = { callSign: sender, position: { lat: coordinate.latitudine, lon: coordinate.longitudine } };
            stationsData.push(newStation);
            
            console.log(stationsData);
        }

    }
    else
    {
        console.log("No CONTENT decode!");
    }
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


//TODO: TEST - remove it when finish
decodeCoordinate("!L9=#_QZ:va");