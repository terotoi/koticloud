
.PHONY: all clean serve watchdev dev docker_demo docker_demo_db 

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
		--build-arg TZ=`cat /etc/timezone` \
		--build-arg cfg="./etc/config_demo.json" \
		-t koticloud .

docker_demo_db: 
	docker build -f etc/Dockerfile.db -t koticloud_db .

demo: docker_demo docker_demo_db

demo_gz: demo
	docker image save -o koticloud.tar koticloud
	gzip koticloud.tar
	docker image save -o koticloud_db.tar koticloud_db
	gzip koticloud_db.tar

clean:
	cd matui && make clean
	rm -rf server/koticloud cli/koticli \
		config_docker.json etc/config_demo.json docker-compose.yml \
		koticloud.tar koticloud_db.tar \
		koticloud.tar.gz koticloud_db.tar.gz
		
