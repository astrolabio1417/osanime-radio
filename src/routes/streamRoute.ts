import express from "express";
import { OsAnimeRadio } from "../utils/express-radio";
import { InterfaceRadioPlaylistItem } from "../@types/express-radio";
import { shuffle } from "../utils/shuffle";
const streamRoute = express.Router();
import ost from "../public/ost-music.json";

const ostList = ost?.filter((a) => a.image || a.url || a.title);
const osanimePlaylist = shuffle(ostList);
const playlists: InterfaceRadioPlaylistItem[] = osanimePlaylist?.map(
  (item) => ({
    title: item?.title,
    file: item?.url,
    image: item?.image,
  })
);
const radio = new OsAnimeRadio(playlists);
radio.play();

streamRoute.get("/", (req, res) => {
  radio.connected.push(res);

  function removeConnected() {
    const i = radio.connected.indexOf(res);
    console.log(`${i} got disconnected!`);
    i != -1 && radio.connected.splice(i, 1);
  }

  req.on("close", removeConnected);
  res.setHeader("content-type", "audio/mpeg");
});

streamRoute.get("/queue", (req, res) => {
  res.json(radio.playlists.slice(0, 50));
});

export default streamRoute;
