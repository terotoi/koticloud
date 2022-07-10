# Dockerfile
FROM debian:stable

ARG TZ
ARG cfg="./etc/config_demo.json"

RUN apt-get update && DEBIAN_FRONTEND=noninteractive \
	apt-get install -y locales locales-all ffmpeg imagemagick
RUN localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8
ENV LC_ALL en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US.UTF-8

RUN mkdir "/data"

WORKDIR "/dist"
COPY "server/koticloud" .
COPY "cli/koticli" .
COPY "./static" "./static"

COPY "${cfg}" "./config.json"

EXPOSE 7070

CMD ["sh", "-c", "/dist/koticloud -c ./config.json serve"]
