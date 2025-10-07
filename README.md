# Off Grid Tracker

This is a LoRa APRS off grid Map, this application is designed to display received stations on a map when you're without internet and can't use traditional sites ([aprs.fi](https://aprs.fi/), [lora.ham-radio-op.net](https://lora.ham-radio-op.net/), etc.) but still want to track the location of other stations.

> This can be particularly useful in cases where natural or other events prevent normal internet access.

The picture below show the last version of application.

![OGT-Screen-0.2.0](/misc/OGT-Screen-0.2.0.png)

You can try it, but without tails on map area, simply connect to this link [https://bobboteck.github.io/OffGridTracker/](https://bobboteck.github.io/OffGridTracker/) and connect your Gateway to your PC.

## How to use it

In this section I will explain how to use the application.

### Receiver

For hardware, I used a 433MHz T-Beam board for amateur radio, but any board supported by CA2RXU's [LoRa_APRS_iGate](https://github.com/richonguzman/LoRa_APRS_iGate) project will work.

After programming the board as a gateway, it must be configured following the instructions provided in the project. The only thing I didn't configure was the Wi-Fi connection, to keep it completely disconnected from the network, given the purpose of the project.

The board must then be connected to the PC where the application is running using the USB cable.

The USB connection is seen as a serial port, which the program uses to send the data received via radio to the computer. This data is processed by the application and displayed on the map.

> Make sure the USB cable used is a data cable.

### Web server

The application is entirely built using HTML and Javascript, all the libraries used (leaflet, bootstrap) are downloaded locally to work offline, but to be able to display the map tiles it is necessary that everything is called from a Web Server.

### Download the Tiles PNG files

Please note that to have the maps available offline and locally, they must be downloaded to the **tiles** folder of project. Since they are all images, they take up disk space. For example, the portion of the map visible in the first image I used, which allows a zoom range of 10 to 16, takes up about 90 MB of disk space.

To download the map tiles locally I used the Python-based [OfflineMapDownloader](https://github.com/0015/OfflineMapDownloader) project, which allows you to select a portion of the map and choose the zoom levels, then it will automatically take care of downloading all the images to the local folder.

### How to run application

After you downloaded the tiles of map, you can follow this speps to run the application. If you have Python 3 installed on the PC, these istructions are the same on Windows and Linux.

1) Clone the repository in your repo folder

```shell
git clone https://github.com/bobboteck/OffGridTracker.git
```

2) Copy the downloaded tiles into the **tiles** folder of project

3) Connect your LoRa module to the antenna and then to your PC via the USB cable

4) Go to the root folder of project and run this python command

```shell
python3 -m http.server 8000
```

5) Now you can open the browser, it need to be support Serial communication (latest version of Chrome, Edge are ok) and go to the url: [http://localhost:8000](http://localhost:8000)

6) In the web application, click on the Connect button, in the panel that opens, select the serial port associated with the hardware board

7) Now wait for data ...

> Thanks to [Gianmarco](https://github.com/Gianmarco-Maisano) for the test on Ubuntu 24

#### If you don't have Python installed on Windows

For Windows, I found an alternative for running the application, you can use [Rebex Tiny Web Server](https://www.rebex.net/tiny-web-server/), which is free, lightweight, and easy to set up. Just download the ZIP file and unzip it (no installation required) in the desired location. The OffGridTracker project files should be placed in the **wwwroot** folder.

After configuring the web server, you can **clone** the entire repository into the server's wwwroot folder, with this command.

```shell
git clone https://github.com/bobboteck/OffGridTracker.git
```

Then copy the downloaded tiles into the **tiles** folder of project, start the server, open the browser and go to the url: [https://dfw01w10:11443/OffGridTracker/](https://dfw01w10:11443/OffGridTracker/).

Below is an example image of my setup.

![OGT-Esempio-path](/misc/OGT-Esempio-path.png)

## How to contribute to the project

...
