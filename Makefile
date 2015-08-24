build:
	npm install --msvs_version=2013
	bundle install
	node_modules/gulp/bin/gulp.js build

run:
	node_modules/electron-prebuilt/dist/Electron.app/Contents/MacOS/Electron .

test:
	node node_modules/tap/bin/run.js test/*.js

watch:
	node_modules/gulp/bin/gulp.js watch

.PHONY: build run test
