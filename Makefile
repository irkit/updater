build:
	npm install

run:
	node_modules/electron-prebuilt/dist/Electron.app/Contents/MacOS/Electron .

test:
	node node_modules/tap/bin/run.js test/*.js

.PHONY: build run test
