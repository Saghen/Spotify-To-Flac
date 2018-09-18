'use strict'

const spotify = require('./spotify.js'),
    Scraper = require('./scraper.js');


async function init() {
    await spotify.init();
    let playlist = await spotify.choosePlaylist('megamawman');
    let songs = await spotify.getPlaylist(playlist.id);
    console.log(songs);

    let scraper = new Scraper({
        authors: ['David Guetta', 'Bebe Rexha', 'J Balvin'],
        name: 'Say My Name',
        album: '7',
        length: 198.946
    });

    scraper.start();
}

init();