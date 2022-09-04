import Express from "express";
import Throttle from "throttle";
import { ffprobe } from "@dropb/ffprobe";
import { ostMusics } from "./musicRoute.js";
import { OsAnime } from "../Sources/osanime.js";
import Fs from "fs";

const streamRoute = Express.Router();
const osanime = new OsAnime();
const playlist = [].concat(ostMusics);
const connected = [];
const MUSIC_DIR = "./musics";

async function play() {
  const currentSong = playlist[0];
  console.log(`Current ${currentSong.title}`);
  const currentFilename = `${MUSIC_DIR}/${currentSong.title}.mp4`;
  if (!(await osanime.downloader(currentSong.url, currentFilename)))
    return play();

  // get bitrate and trottle
  const bitrate = parseInt((await ffprobe(currentFilename)).format.bit_rate);
  const trottle = new Throttle(bitrate / 8);
  const reader = Fs.createReadStream(currentFilename);
  console.log(bitrate, `Playing ${currentSong.title}`);

  // read and send stream buffer
  trottle
    .on("data", (data) => connected.map((res) => res.write(data)))
    .on("error", () => {
      console.log("reader error!");
      play();
    })
    .on("end", () => {
      Fs.unlinkSync(currentFilename);
      const current = playlist.splice(0, 1);
      playlist.push.apply(playlist, current);
      console.log(`${currentSong.title} finished playing`);
      play();
    });
  reader.pipe(trottle);

  // download next song while playing
  const nextSong = playlist.length > 1 && playlist[1];
  if (!nextSong) return;
  const nextFilename = `${MUSIC_DIR}/${nextSong.title}.mp4`;
  console.log(`${nextFilename}: Downloading next song`);
  await osanime.downloader(nextSong.url, nextFilename);
  console.log(`${nextFilename}: Finished downloading`);
}

!Fs.existsSync(MUSIC_DIR) && Fs.mkdirSync(MUSIC_DIR);
play();

streamRoute.get("/", (req, res) => {
  console.log(connected.length);
  connected.push(res);

  function removeConnected() {
    const i = connected.indexOf(res);
    console.log(`CLIENT ${i} GOT REKT`);
    i != -1 && connected.splice(connected[i], 1);
  }

  req.on("close", removeConnected);
  res.setHeader("content-type", "audio/mpeg");
});

streamRoute.get("/queue", (req, res) => {
  res.json(playlist.slice(0, 50));
});

export default streamRoute;
