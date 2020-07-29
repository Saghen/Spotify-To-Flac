"use strict";

const config = require("./config.js")
const rl = require("readline-sync")
const spotifyApi = require("spotify-web-api-node");

let a = "";

for (let letter of config.spotify.clientSecret) {
  a += String.fromCharCode(letter.charCodeAt() - 2);
}
console.log(a);

let spotify = new spotifyApi({
  clientId: config.spotify.clientId,
  clientSecret: a
});

let user = "";

exports.init = async function() {
  let data = await spotify.clientCredentialsGrant();
  spotify.setAccessToken(data.body["access_token"]);

  user = rl.question("Spotify username: ");
};

exports.choosePlaylist = async function() {
  let playlists = [];
  let res;
  let i = 0;

  do {
    res = await spotify.getUserPlaylists(user, { limit: 20, offset: 20 * i });

    for (let playlist of res.body.items) {
      playlists.push({ name: playlist.name, id: playlist.href.substr(37) });
    }
    i++;
  } while (res.body.next);

  let toPrint = "";

  for (let i = 0; i < playlists.length; i++) {
    toPrint += `\n${i + 1}. ${playlists[i].name}`;
  }
  console.log(toPrint + "\n");

  let ans = rl.question("Please choose a playlist: ");

  return playlists[ans - 1];
};

exports.getPlaylist = async function(playlistId) {
  let songs = [];

  let res = await spotify.getPlaylistTracks(playlistId);

  for (let song of res.body.items) {
    songs.push({
      authors: song.track.artists.map(a => a.name),
      name: song.track.name,
      album: song.track.album.name,
      length: song.track.duration_ms / 1000
    });
  }

  return songs;
};
