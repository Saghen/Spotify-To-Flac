'use strict'

let cheerio = require('cheerio')
	, cheerioAdv = require('cheerio-advanced-selectors')
	, request = require('request-promise-native')
	, fs = require('fs');

cheerio = cheerioAdv.wrap(cheerio);

module.exports = class Scraper {
	constructor({ authors: songAuthors, name: songName, album: songAlbum, length: songLength }) {
		this.authors = songAuthors;
		this.name = songName;
		this.album = songAlbum;
		this.length = songLength;
		this.query = `${songName}-${songAuthors.join('-')}`.replace(' ', '-');
		this.songData = [];
	}

	start() {
		return request('http://search.chiasenhac.vn/search.php?s=' + this.query)
			.then(htmlString => {
				this.processSearch(htmlString);
				console.log(this.songData);
				this.downloadSong()
			})
			.catch(err => { console.log(err) });
	}

	processSearch(htmlString) {
		const $ = cheerio.load(htmlString);

		// Go through ever row
		$('.tbtable:first tbody').find('tr:not(:first-child)').each((i, elem) => {
			this.songData.push(this.processRow($, elem))
		});
	}

	processRow($, elem) {
		let songData = {};

		// Check every cell
		$(elem).find('td div.tenbh').each((i, elem2) => {
			songData = { ...this.getSongTitle($, elem2), ...songData };
		});

		$(elem).find('td span.gen').each((i, elem2) => {
			let songTime = elem2.children[0].data.split(':');
			songData.time = songTime.reduce((prev, val, i, arr) => {
				if (i == 1) prev = +prev * 60 ** (arr.length - 1);
				return prev += +val * 60 ** (arr.length - i - 1);
			});
		});

		return songData;
	}

	getSongTitle($, elem) {
		let songInfo = {};

		$(elem).find('p').each((i, elem2) => {
			if (i == 0) {
				songInfo.name = elem2.children[0].children[0].data;
				songInfo.url = elem2.children[0].attribs.href.replace('.html', '_download.html'); // Possible better alternative?
			}
			else songInfo.authors = elem2.children[0].data.split('; ');
		});

		return songInfo;
	}

	downloadSong() {
		let downloadInfo;
		return request(this.songData[0].url)
			.then(htmlString => {
				downloadInfo = this.getDownloadLink(htmlString);
				console.log(downloadInfo);
				return request(downloadInfo.url);
			})
			.then(res => {
				let file = fs.createWriteStream(`${songName} - ${songAuthors.join(', ')}.${downloadInfo.format}`);
				res.pipe(file);
			});
	}

	getDownloadLink(htmlString) {
		const $ = cheerio.load(htmlString);

		let downloadOptions = [];

		$('#downloadlink2 > b:first').find('a').each((i, elem) => {
			let downloadInfo = this.processSongDownload($, elem);
			if(downloadInfo !== undefined) downloadOptions.push(downloadInfo);
		});

		// Implement a system for asking the user for the format they wish for
		return downloadOptions.filter(obj => { return obj.format === 'flac' })[0];
	}

	processSongDownload($, elem) {
		if (elem.children.length < 3) return;
		return {
			format: elem.children[0].data.substr(13).trim().toLowerCase(),
			size: elem.children[2].data.trim().toLowerCase(),
			url: elem.attribs.href
		};
	}

	getBestMatch() {

	}
}