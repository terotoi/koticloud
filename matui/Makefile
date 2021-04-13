
.PHONY: all dev clean

all: node_modules static/main.js

node_modules: package.json
	yarn install

static/main.js: ${SOURCES}
	INLINE_RUNTIME_CHUNK=false npx webpack --mode=production

prod: node_modules
	INLINE_RUNTIME_CHUNK=false npx webpack --mode=production

dev:
	rm -f static/ui/main.js
	npx webpack --mode=development -w

clean:
	rm -rf static/ui/* static/fonts/* node_modules

SOURCES=\
	src/api.js            src/dialogs/error.js     src/fm/filemanager.js  src/init.js         src/views/node.js \
	src/appbar.js         src/dialogs/input.js     src/fm/grid.js         src/login.js        src/views/pdf.js \
	src/app.js            src/dialogs/password.js  src/fm/list.js         src/theme.js        src/views/playable.js \
	src/context.js        src/fm/action_menu.js    src/fm/progress.js     src/thumbs.js       src/views/text.js \
	src/dialogs/about.js  src/fm/card.js           src/fm/upload.js       src/util.js         src/window.js \
	src/dialogs/alert.js  src/fm/dirview.js        src/fm/util.js         src/views/image.js
