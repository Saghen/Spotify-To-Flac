"use strict";

let cheerio = require("cheerio");
const cheerioAdv = require("cheerio-advanced-selectors");
const request = require("request-promise-native");
const fs = require("fs");
const stringSimilarity = require("string-similarity");
const ProgressBar = require("progress");
const https = require("https");
const queryString = require("querystring");

cheerio = cheerioAdv.wrap(cheerio);

module.exports = class Scraper {
  constructor({ authors, name, album, length }, multiProgress) {
    this.authors = authors;
    this.name = name;
    this.album = album;
    this.length = length;
    this.query = `${name}-${authors.join("-")}`.replace(" ", "-");
    this.songData = [];
    this.multiProgress = multiProgress;
  }

  start() {
    return request(
      "http://search.chiasenhac.vn/search.php?s=" +
        queryString.escape(this.query)
    )
      .then((htmlString) => {
        this.processSearch(htmlString);
        this.downloadSong();
      })
      .catch((err) => {
        console.log("Yeah it broke");
      });
  }

  processSearch(htmlString) {
    const $ = cheerio.load(htmlString);

    // Go through ever row
    $(".tbtable:first tbody")
      .find("tr:not(:first-child)")
      .each((i, elem) => {
        this.songData.push(this.processRow($, elem));
      });
  }

  processRow($, elem) {
    let songData = {};

    // Check every cell
    $(elem)
      .find("td div.tenbh")
      .each((i, elem2) => {
        songData = { ...this.getSongTitle($, elem2), ...songData };
      });

    $(elem)
      .find("td span.gen")
      .each((i, elem2) => {
        let songTime = elem2.children[0].data.split(":");
        songData.time = songTime.reduce((prev, val, i, arr) => {
          if (i == 1) prev = +prev * 60 ** (arr.length - 1);
          return (prev += +val * 60 ** (arr.length - i - 1));
        });
      });

    return songData;
  }

  getSongTitle($, elem) {
    let songInfo = {};

    $(elem)
      .find("p")
      .each((i, elem2) => {
        if (i == 0) {
          songInfo.name = elem2.children[0].children[0].data;
          songInfo.url = elem2.children[0].attribs.href;
        } else songInfo.authors = elem2.children[0].data.split("; ");
      });

    return songInfo;
  }

  downloadSong() {
    let downloadInfo;
    return request(this.getBestMatch().url)
      .then((htmlString) => {
        downloadInfo = this.getDownloadLink(htmlString);

        let file = fs.createWriteStream(
          `${this.name} - ${this.authors.join(", ")}.${downloadInfo.format}`
        );

        let req = https.request(downloadInfo.url, (res) => {
          res.pipe(file);
        });

        req.on("response", (res) => {
          var len = parseInt(res.headers["content-length"], 10);

          var bar = this.multiProgress.newBar(
            ` :percent :etas [:bar] ${this.name}`,
            {
              complete: "=",
              incomplete: " ",
              width: 20,
              total: len,
            }
          );

          res.on("data", function (chunk) {
            bar.tick(chunk.length);
          });

          res.on("end", () => bar.terminate());
        });

        req.end();
      })
      .catch((err) => console.error(err));
  }

  getDownloadLink(htmlString) {
    const $ = cheerio.load(htmlString);

    let downloadOptions = [];

    $(
      "#pills-download > div > div.card-body > div > div.col-12.tab_download_music > ul"
    )
      .find("a")
      .each((i, elem) => {
        let downloadInfo = this.processSongDownload($, elem);
        if (downloadInfo !== undefined) downloadOptions.push(downloadInfo);
      });

    // Implement a system for asking the user for the format they wish for
    let download = downloadOptions.filter((obj) => obj.format === "flac")[0];
    if (download === undefined)
      download = downloadOptions.filter((obj) => obj.format === "m4a")[0];
    if (download === undefined)
      download = downloadOptions.filter((obj) => obj.format === "mp3")[0];
    if (download === undefined) download = downloadOptions[0];
    if (download === undefined)
      console.error(`An error occured finding a download for ${this.name}.`);

    return download;
  }

  processSongDownload($, elem) {
    const children = $(elem).children()
    if (children.length < 2) return;
    return {
      format: $($(children).get(1)).text().split(" ")[0].trim().toLowerCase(),
      url: elem.attribs.href,
    };
  }

  getBestMatch() {
    let matches = stringSimilarity.findBestMatch(
      this.name,
      this.songData.map((obj) => obj.name)
    );
    return this.songData.find((obj) => obj.name == matches.bestMatch.target);
  }
};
