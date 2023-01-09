
.PHONY: all prod prodjs watchdev \
	docker_demo docker_demo_db demo demo_gz

all: static/main.js server/koticloud cli/koticli

prod: prodjs koticloud

server/koticloud: server/*.go server/*/*.go
	cd server && go build -o koticloud

cli/koticli: cli/*.go server/api/*.go
	cd cli && go build -o koticli

rundev: all
	./server/koticloud serve

watchdev:
	find . \( -path './ui/src/*.js' -or -path './ui/src/*.jsx' \
		-or -path './server/*.go' -or -path './static/css/*.css' \) | \
		entr -r make rundev

static/main.js: ui/node_modules ui/src/*.js ui/src/*.jsx ui/src/*/*.js ui/src/*/*.jsx ui/src/*/*/*.jsx static/pdf.worker.min.js
	cd ui && npm run build

static/pdf.worker.min.js: ui/node_modules/pdfjs-dist/build/pdf.worker.min.js
	cp ./ui/node_modules/pdfjs-dist/build/pdf.worker.min.js static/pdf.worker.min.js

ui/node_modules: ui/package.json
	cd ui && npm install

clean:
	rm -rf static/main.js static/*.woff2 static/main.js.LICENSE.txt \
		static/*.map static/*.woff \
		ui/node_modules \
		server/koticloud cli/koticli \
		config_docker.json etc/config_demo.json docker-compose.yml \
		koticloud.tar koticloud_db.tar \
		koticloud.tar.gz koticloud_db.tar.gz

### Docker images ###

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
