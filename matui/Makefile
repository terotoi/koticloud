
.PHONY: all dev clean prod 

all: node_modules static/main.js

node_modules: package.json
	yarn install

static/main.js: ${SRC}
	INLINE_RUNTIME_CHUNK=false npx webpack --mode=production
	npx webpack --mode=production

dev:
	rm -f static/main.js
	npx webpack --mode=development -w

prod:
	rm -f static/main.js
	npx webpack --mode=production

clean:
	rm -rf static/ui/* static/fonts/* node_modules static/*.js static/*js.*txt

SRC=\
	./dialogs/input.js \
	./dialogs/alert.js \
	./dialogs/password.js \
	./dialogs/error.js \
	./dialogs/about.js \
	./fm/upload.js \
	./fm/grid.js \
	./fm/action_menu.js \
	./fm/dialogs/new_file.js \
	./fm/card.js \
	./fm/progress.js \
	./fm/util.js \
	./fm/filemanager.js \
	./fm/list.js \
	./fm/dirview.js \
	./app.js \
	./login.js \
	./util.js \
	./appbar.js \
	./theme.js \
	./api.js \
	./init.js \
	./windows/window.js \
	./windows/wm.js \
	./windows/render.js \
	./views/image.js \
	./views/text.js \
	./views/pdf.js \
	./views/playable.js \
	./views/blank.js \
	./views/node.js \
	./thumbs.js
