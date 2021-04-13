
.PHONY: all clean serve watchdev dev

all: matui/node_modules matui/static/main.js server/koticloud cli/koticli

server/koticloud: server/*.go server/*/*.go
	cd server && go build -o koticloud

cli/koticli: cli/*.go
	cd cli && go build -o koticli

servedev: server/koticloud
	./server/koticloud -c "${HOME}/opt/koticloud/config_${HOSTNAME}.json" -dev serve

watchdev:
	find . -iname '*.go' | entr -r make servedev

matui/node_modules: matui/package.json
	cd matui && yarn install

matui/static/main.js: matui/node_modules matui/src/*.js matui/src/*/*.js
	cd matui && make

jsprod:
	cd matui && make prod	

jsdev: 
	cd matui && make dev

docker_demo: all
	etc/create_config.sh
	docker build \
		--build-arg cfg_arg="./config_docker.json" \
		-t koticloud .

demo: docker_demo docker_demo_db

docker_demo_gz: docker
	docker image save -o koticloud.tar koticloud
	gzip koticloud.tar

docker_demo_db:
	docker build -f etc/Dockerfile.db -t koticloud_db .
	rm -f etc/schema_docker.sql

clean:
	rm -rf server/koticloud cli/koticli \
		matui/static/main.js matui/static/main.worker.js \
		matui/static/fonts/* matui/node_modules \
		config_docker.json

