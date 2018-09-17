'use strict'

const spotify = require('./spotify.js');


async function init() {
    await spotify.init();
    let playlist = await spotify.choosePlaylist('megamawman');
    let songs = await spotify.getPlaylist(playlist.id);
    console.log(songs);
}

init();