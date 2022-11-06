import { Router as router } from "express";
import { OsAnimeRadio } from "../utils/express-radio";
import { InterfaceRadioPlaylistItem } from "../@types/express-radio";
import { InterfaceOsanimeItem } from "../@types/osanime";
import { v4 as uuidv4 } from "uuid";
import contentDisposition from "content-disposition";
import { getAnimeSongs } from "../utils/osanime";
import songs from "../public/songs.json";
import fs from "fs";
import { Headers } from "node-fetch";
import { shuffle } from "../utils/shuffle";

const streamRoute = router();
const radio = new OsAnimeRadio();
radio.play();
radio.update(shuffle(songs));

async function updateRadio() {
  const osanimePlaylist: InterfaceOsanimeItem[] = await getAnimeSongs(100);
  const radioPlaylist: InterfaceRadioPlaylistItem[] = osanimePlaylist?.map(
    (item) => ({
      id: uuidv4(),
      title: item?.title,
      file: item?.url,
      image: item?.image,
    })
  );
  fs.writeFileSync(`./public/songs.json`, JSON.stringify(radioPlaylist));
  radio.update(radioPlaylist);
  radio.shuffle();
}

streamRoute.get("/", (req, res) => {
  radio.addClient(res);
  req.on("close", () => radio.removeClient(res));
  res.setHeader("content-type", "audio/mpeg");
});

streamRoute.get("/update-playlist", async (req, res) => {
  if (req.query?.pw !== process.env.PASSWORD) {
    return res.status(400).json({ message: "wrong password!" });
  }
  await updateRadio();
  res.json({ message: `playlist updated! Total: ${radio.playlist.length}` });
});

streamRoute.get("/queue", (_, res) => {
  res.json({
    results: radio.playlist.slice(0, 50),
    priorities: radio.priorities,
    connected: radio.clients.length,
  });
});

streamRoute.post("/add-to-priority", (req, res) => {
  const result = radio.addToPriority(req.body?.id);

  if (typeof result === "string") {
    return res.status(400).json({
      message: result,
    });
  }
  res.json({
    result: result,
  });
});

streamRoute.get("/search", (req, res) => {
  const query = req.query?.q?.toString();

  res.json({
    query: query,
    results: radio.searchByTitle(query),
  });
});

streamRoute.get("/:id", (req, res) => {
  res.json(radio.searchById(req.params.id)?.result);
});

streamRoute.get("/:id/download", async (req, res) => {
  const { result } = radio.searchById(req.params.id);

  if (!result?.file) return res.status(400).json({ message: "ID not found!" });

  const headers = new Headers({
    range: req.headers.range ?? "bytes=0-",
  });
  const reader = await radio.createReadStream(result.file, headers);

  if (!reader) return res.status(400).json({ message: "file not found!" });

  res.status(req.headers.range ? 206 : 200);
  res.setHeader("content-type", "audio/mpeg");
  res.setHeader(
    "content-disposition",
    contentDisposition(`${result?.title}.mp3`)
  );
  res.setHeader("accept-ranges", "bytes");
  res.setHeader("content-length", reader.size);
  reader.range && res.setHeader("content-range", reader.range);

  reader?.stream.pipe(res);
});

export default streamRoute;
