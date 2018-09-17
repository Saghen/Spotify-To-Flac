'use strict'

let spotify = require('./spotify.js');


async function init() {
    await spotify.init();
    spotify.choosePlaylist();
}

init();