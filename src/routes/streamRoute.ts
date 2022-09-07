import express from "express";
import { OsAnimeRadio } from "../utils/express-radio";
import { InterfaceRadioPlaylistItem } from "../@types/express-radio";
import { shuffle } from "../utils/shuffle";
const streamRoute = express.Router();
import ost from "../public/ost-music.json";
import { InterfaceOsanimeItem } from "../@types/osanime";
import { v4 as uuidv4 } from "uuid";
import contentDisposition from "content-disposition";

const ostList = ost?.filter((a) => a.image || a.url || a.title);
const osanimePlaylist: InterfaceOsanimeItem[] = shuffle(ostList);
const playlists: InterfaceRadioPlaylistItem[] = osanimePlaylist?.map(
  (item) => ({
    id: uuidv4(),
    title: item?.title,
    file: item?.url,
    image: item?.image,
  })
);

const radio = new OsAnimeRadio(playlists);
radio.play();

streamRoute.get("/", (req, res) => {
  radio.addClient(res);
  req.on("close", () => radio.removeClient(res));
  res.setHeader("content-type", "audio/mpeg");
});

streamRoute.get("/queue", (req, res) => {
  res.json({
    results: radio.playlists.slice(0, 50),
    priorities: radio.priorities,
    connected: radio.clients.length,
  });
});

streamRoute.get("/:id", (req, res) => {
  res.json(radio.searchById(req.params.id));
});

streamRoute.get("/:id/download", async (req, res) => {
  const { result } = radio.searchById(req.params.id);

  if (result) {
    res.setHeader("content-type", "audio/mpeg");
    res.setHeader(
      "content-disposition",
      contentDisposition(`${result?.title}.mp3`)
    );
    const reader = await radio.createReadStream(result);
    reader?.pipe(res);
  } else {
    res.status(400).json({ message: "ID not found" });
  }
});

streamRoute.post("/add-to-priority", (req, res) => {
  const result = radio.addToPriority(req.body?.id);

  if (result === -1 || result === -2) {
    res.status(400).json({
      message: result === -2 ? "ID is in the priority lists." : "ID Not Found",
    });
  } else {
    res.json({
      result: result,
    });
  }
});

export default streamRoute;
