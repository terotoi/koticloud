
# KotiCloud - file storage and multimedia server #

![Main view](docs/images/main.png)

## Introduction ##

KotiCloud is a file and multimedia server. Is is currently heavily work-in-progress.

It can be used through a web interface or a command line client. You can upload, download, copy, move, rename and delete files, edit text files, read PDFs, watch videos, listen to audio files and look at images.

## Requirements ##

Go 1.18, node.js, docker, docker-compose-plugin and make.

## Building a demo image ##

You can build a docker demo image by typing:

> make demo

This command builds two docker images: "koticloud" for the application and "koticloud_db" for the supporting PostgreSQL database. To get the system up, you can use docker-compose:

> docker compose up

The server can then be reached using http://localhost:7070

Use "admin" as username and password.

## Third party software and assets ##

- React [https://reactjs.org]
- Material-UI [https://material-ui.com]
- PDF.js [https://mozilla.github.io/pdf.js]
- Icons from RemixIcons [https://remixicon.com]
