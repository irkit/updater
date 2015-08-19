build:
	npm install --msvs_version=2013
	bundle install

run:
	node_modules/electron-prebuilt/dist/Electron.app/Contents/MacOS/Electron .

test:
	node node_modules/tap/bin/run.js test/*.js

watch:
	compass watch .

.PHONY: build run test
