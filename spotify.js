'use strict'

const config = require('./config.js'),
    request = require('request'),
    spotifyApi = require('spotify-web-api-node'),
    http = require('http');

let spotify = new spotifyApi({
    clientId: config.spotify.clientId,
    clientSecret: config.spotify.clientSecret
});

exports.init = async function () {
    let data = await spotify.clientCredentialsGrant();
    console.log('The access token is ' + data.body['access_token']);
    spotify.setAccessToken(data.body['access_token']);
}

exports.choosePlaylist = function () {
    let playlists = [];

    spotify.getUserPlaylists('megamawman', {}).then((res) => {
        console.log(res.body)
        for (let playlist of res.body.items) {
            playlists.push({ name: playlist.name, href: playlist.href });
        }
        next = res.body.next;
        let toPrint = '';

        for (let i = 0; i < playlists.length; i++) {
            toPrint += `\n${i + 1}. ${playlists[i].name}`;
        }
        console.log(toPrint);
    });
}