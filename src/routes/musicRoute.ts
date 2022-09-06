import Express from "express";
import fs from "fs";
import { IOsPlaylistItem } from "../utils/osanime";
const musicRoute = Express.Router();

const ostMusics: IOsPlaylistItem[] = JSON.parse(
  fs.readFileSync("/src/src/public/ost-music.json", "utf-8")
);

musicRoute.use((req, res, next) => {
  console.log("/api ROUTE");
  next();
});

musicRoute.get("/", (req, res) => {
  const search = req.query.search;

  res.json(
    search
      ? ostMusics.filter((music) => music.title.includes(search?.toString()))
      : ostMusics
  );
});

musicRoute.get("/:name", (req, res) => {
  const findIndex = ostMusics.findIndex(
    (music) => music?.title == req.params?.name
  );
  res.json(ostMusics[findIndex] ?? { error: "not found!" });
});

export default musicRoute;
export { ostMusics };
