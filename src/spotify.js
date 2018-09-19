'use strict'

const config = require('./config.js'),
    rl = require('readline-sync'),
    spotifyApi = require('spotify-web-api-node');

let spotify = new spotifyApi({
    clientId: config.spotify.clientId,
    clientSecret: config.spotify.clientSecret
});

let user = '';

exports.init = async function () {
    let data = await spotify.clientCredentialsGrant();
    spotify.setAccessToken(data.body['access_token']);

    user = rl.question('Spotify username: ');
}

exports.choosePlaylist = async function () {
    let playlists = [];

    console.log(user);

    let res = await spotify.getUserPlaylists(user);

    for (let playlist of res.body.items) {
        playlists.push({ name: playlist.name, id: playlist.href.substr(37) });
    }

    let toPrint = '';

    for (let i = 0; i < playlists.length; i++) {
        toPrint += `\n${i + 1}. ${playlists[i].name}`;
    }
    console.log(toPrint + '\n');

    let ans = rl.question('Please choose a playlist: ');

    return playlists[ans - 1];
}

exports.getPlaylist = async function (playlistId) {
    let songs = [];

    let res = await spotify.getPlaylistTracks(playlistId);

    for (let song of res.body.items) {
        songs.push({authors: song.track.artists.map(a => a.name), name: song.track.name, album: song.track.album.name, length: song.track.duration_ms / 1000 });
    }
    return songs;
}