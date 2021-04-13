#!/bin/bash

_config_file="./etc/config_demo.json"
_compose_file="./docker-compose.yml"

_db_password="`openssl rand -base64 10`"
_jwt_secret="`openssl rand -base64 32`"
_timezone="`cat /etc/timezone`"

_config_contents="
{
  \"database\": \"dbname=koticloud user=kotidbuser password=${_db_password} host=db port=5432 sslmode=disable\",
  \"jwt_secret\": \"${_jwt_secret}\",
  \"data_root\": \"/data\",
  \"file_root\": \"\",
  \"thumb_root\": \"\",
  \"upload_dir\": \"\",
  \"static_root\": \"/dist/static\",
  \"initial_user\": \"admin\",
  \"initial_password\": \"admin\"
}
"

_compose_contents="
version: \"3.9\"
    
services:
  db:
    image: koticloud_db:latest
    volumes:
      - koticloud_db:/var/lib/postgresql/data
    restart: always
    environment:
      PGDATA: /var/lib/postgresql/data/pgdata
      POSTGRES_PASSWORD: ${_db_password}
      POSTGRES_USER: kotidbuser
      POSTGRES_DB: koticloud
    
  koticloud:
    depends_on:
      - db
    image: koticloud:latest
    volumes:
      - koticloud_data:/data
    ports:
      - \"7070:7070\"
    restart: always
    environment:
      TZ: ${_timezone}

volumes:
  koticloud_data: {}
  koticloud_db: {}
"

if [ ! -f "$_config_file" ]; then
  echo -e "$_config_contents" >"$_config_file"
fi

if [ ! -f "$_compose_file" ]; then
  echo -e "$_compose_contents" >"$_compose_file"
fi

