var fs = require('fs');
var request = require('request');
var temp = require('temp');
temp.track(); // automatic cleanup

var version = '0.0.1';

// % curl "https://api.github.com/repos/irkit/osx-launcher/releases"
// [
//   {
//     "url": "https://api.github.com/repos/irkit/osx-launcher/releases/519921",
//     "assets_url": "https://api.github.com/repos/irkit/osx-launcher/releases/519921/assets",
//     "upload_url": "https://uploads.github.com/repos/irkit/osx-launcher/releases/519921/assets{?name}",
//     "html_url": "https://github.com/irkit/osx-launcher/releases/tag/0.2.2",
//     "id": 519921,
//     "tag_name": "0.2.2",
//     "target_commitish": "master",
//     "name": "0.2.2",
//     "draft": false,
//     "author": {
//       "login": "mash",
//       "id": 3437,
//       "avatar_url": "https://avatars.githubusercontent.com/u/3437?v=3",
//       "gravatar_id": "",
//       "url": "https://api.github.com/users/mash",
//       "html_url": "https://github.com/mash",
//       "followers_url": "https://api.github.com/users/mash/followers",
//       "following_url": "https://api.github.com/users/mash/following{/other_user}",
//       "gists_url": "https://api.github.com/users/mash/gists{/gist_id}",
//       "starred_url": "https://api.github.com/users/mash/starred{/owner}{/repo}",
//       "subscriptions_url": "https://api.github.com/users/mash/subscriptions",
//       "organizations_url": "https://api.github.com/users/mash/orgs",
//       "repos_url": "https://api.github.com/users/mash/repos",
//       "events_url": "https://api.github.com/users/mash/events{/privacy}",
//       "received_events_url": "https://api.github.com/users/mash/received_events",
//       "type": "User",
//       "site_admin": false
//     },
//     "prerelease": false,
//     "created_at": "2014-08-28T02:36:17Z",
//     "published_at": "2014-08-28T03:14:00Z",
//     "assets": [
//       {
//         "url": "https://api.github.com/repos/irkit/osx-launcher/releases/assets/222400",
//         "id": 222400,
//         "name": "IRLauncher.app.zip",
//         "label": null,
//         "uploader": {
//           "login": "mash",
//           "id": 3437,
//           "avatar_url": "https://avatars.githubusercontent.com/u/3437?v=3",
//           "gravatar_id": "",
//           "url": "https://api.github.com/users/mash",
//           "html_url": "https://github.com/mash",
//           "followers_url": "https://api.github.com/users/mash/followers",
//           "following_url": "https://api.github.com/users/mash/following{/other_user}",
//           "gists_url": "https://api.github.com/users/mash/gists{/gist_id}",
//           "starred_url": "https://api.github.com/users/mash/starred{/owner}{/repo}",
//           "subscriptions_url": "https://api.github.com/users/mash/subscriptions",
//           "organizations_url": "https://api.github.com/users/mash/orgs",
//           "repos_url": "https://api.github.com/users/mash/repos",
//           "events_url": "https://api.github.com/users/mash/events{/privacy}",
//           "received_events_url": "https://api.github.com/users/mash/received_events",
//           "type": "User",
//           "site_admin": false
//         },
//         "content_type": "application/zip",
//         "state": "uploaded",
//         "size": 735816,
//         "download_count": 465,
//         "created_at": "2014-08-28T03:14:16Z",
//         "updated_at": "2014-08-28T03:14:18Z",
//         "browser_download_url": "https://github.com/irkit/osx-launcher/releases/download/0.2.2/IRLauncher.app.zip"
//       }
//     ],
//     "tarball_url": "https://api.github.com/repos/irkit/osx-launcher/tarball/0.2.2",
//     "zipball_url": "https://api.github.com/repos/irkit/osx-launcher/zipball/0.2.2",
//     "body": "Rebuild using Mavericks to avoid \"Unsupported pixel format in CSI\" crash error"
//   },
function releases (owner, repo, callback) {
  // see https://developer.github.com/v3/repos/releases/
  request.get('https://api.github.com/repos/'+owner+'/'+repo+'/releases', { json: true, headers: { 'User-Agent': 'github.js/' + version } }, callback);
}

var Downloader = function () {
  this.initialize.apply(this, arguments);
};
Downloader.prototype.initialize = function (release) {
  this.release = release;
};

// callback(err, path)
Downloader.prototype.download = function(callback) {
  var asset = this.release.assets[0];

  // see https://github.com/bruce/node-temp
  var file = temp.openSync(); // I know, I know but creating temp files are not gonna take much time

  request(asset.url, { headers: { 'Content-Type': 'application/octet-stream' } })
    .on('error', function (err) {
      callback(err);
    })
    .on('response', function (response) {
      console.log("code: ", response.statusCode);
      console.log("headers: ", response.headers);
      callback(null, file.path);
    })
    .pipe(fs.createWriteStream(file.path));
};

module.exports = {
  releases: releases,
  Downloader: Downloader
};
