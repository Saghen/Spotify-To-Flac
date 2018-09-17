"use strict"

const cheerio = require('cheerio')
	, request = require('request-promise-native')
	, rTimeStamp = /[0-9]+:[0-9]{2}/g;

function resolveUrl(url) {
	return request(url)
		.then(htmlString => downloadPageText(htmlString))
		//.then(findLinks)
		//.then(() => this.done = true)
		.catch(err => {console.log(err)});
}

function downloadPageText(htmlString) {
	let $ = cheerio.load(htmlString),
		songDataList = [];

	// Go through ever row
	$('.tbtable tbody').find('tr').each((i, elem) => {

		getRowData($, elem)
		.then(songData => {songDataList.push(songData)})
		.catch(err => {});
	});

	console.log(songDataList);
}

function getBestMatch(songData) {

}

function getRowData($, elem) {
	return new Promise((resolve, reject) => {
		let songData = {};

		// Check every cell
		$(elem).find('td').each((j, elem2) => {

			getSongTitle($, elem2)
			.then(title => {songData.title = title})
			.catch(err => {});

			getSongTime($, elem2)
			.then(time => {songData.time = time})
			.catch(err => {});
		});

		resolve(songData);
	});
}

function getSongTitle($, elem) {
	return new Promise((resolve, reject) => {
		let songTitle = $(elem).find('div div[class=tenbh] p');

		if(songTitle.html() != null) {
			let songName = songTitle.first().find('a').html(),
				songAuthor = songTitle.last().html();

			//console.log('Found song title: ' + songAuthor + ' - ' + songName)

			resolve(songAuthor + ' - ' + songName);
		} else {
			reject();
		}
	});
}

function getSongTime($, elem) {
	return new Promise((resolve, reject) => {
		let songTime = $(elem).find('span').html();

		if(songTime != null) {
			let timeStamp = songTime.match(rTimeStamp)
			
			if(typeof timeStamp[0] !== undefined)
				resolve(timeStamp[0]);
		} else reject();
	});
}

resolveUrl('http://search.chiasenhac.vn/search.php?s=death+grips+get+got');

/*
module.exports = function({ author: songAuthor, name: songName, album: songAlbum, length: songLength}) {
	let urlSearch = 'http://search.chiasenhac.vn/search.php?s=',
		query = songName.replace(' ', '+');


}
*/