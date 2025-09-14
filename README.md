# Off Grid Tracker

This is a LoRa APRS off grid Map, this application is designed to display received stations on a map when you're without internet and can't use traditional sites ([aprs.fi](https://aprs.fi/), [lora.ham-radio-op.net](https://lora.ham-radio-op.net/), etc.) but still want to track the location of other stations.

> This can be particularly useful in cases where natural or other events prevent normal internet access.

The picture below show the first version of application.

![OGT-Screen-0.0.1](/misc/OGT-Screen-0.0.1.png)

## How to use it

In this section I will explain how to use the application.

### Receiver

For hardware, I used a 433MHz T-Beam board for amateur radio, but any board supported by CA2RXU's LoRa_APRS_iGate project will work.

After programming the board as a gateway, it must be configured following the instructions provided in the project. The only thing I didn't configure was the Wi-Fi connection, to keep it completely disconnected from the network, given the purpose of the project.

> I haven't investigated, but it seems that the gateway doesn't transmit its position if it's not connected to the network.

The card must then be connected to the PC where the application is running using the USB cable.

The USB connection is seen as a serial port, which the program uses to send the data received via radio to the computer. This data is processed by the application and displayed on the map.

> Make sure the USB cable used is a data cable.

### Web server

The application is entirely built using HTML and Javascript, all the libraries used (leaflet, bootstrap) are downloaded locally to work offline, but to be able to display the map tiles it is necessary that everything is called from a Web Server.

#### Windows

For Windows, I found [Rebex Tiny Web Server](https://www.rebex.net/tiny-web-server/), which is free, lightweight, and easy to set up. Just download the ZIP file and unzip it (no installation required) in the desired location. The application files should be placed in the **wwwroot** folder.

#### Linux

....

### Clone this repository

After configuring the web server, you can clone the entire repository into the server's wwwroot folder. Below is an example image of my setup.

![OGT-Esempio-path](/misc/OGT-Esempio-path.png)

### Download the Tiles PNG files

Please note that to have the maps available offline and locally, they must be downloaded to the **wwwroot** folder on the web server. Since they are all images, they take up disk space. For example, the portion of the map visible in the first image I used, which allows a zoom range of 10 to 16, takes up about 90 MB of disk space.

To download the map tiles locally I used the Python-based [OfflineMapDownloader](https://github.com/0015/OfflineMapDownloader) project, which allows you to select a portion of the map and choose the zoom levels, then it will automatically take care of downloading all the images to the correct folders.

The folders containing the images will be saved in the path "wwwroot/OffGridTracker/tiles/".

### Start the server and use the application

First connect your LoRa module to the antenna and then to your PC via the USB cable.

To use the application you must start the Web Server and access the application from the browser.

#### Start on Windows

For Windows follow these steps:

- Run the **RebexTinyWebServer.exe** executable, then click the **Start** button in the application panel
- Click on one of the proposed links in the application panel or open the browser and go to the local address and port configured
- In the web application, click on the Connect button, in the panel that opens, select the serial port associated with the hardware board
- Now wait for data ...

#### Start on Linux

...

## Come contribuire

...
