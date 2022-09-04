import Express from "express";
import Fs from "fs";
const musicRoute = Express.Router();
const ostMusics = JSON.parse(
  Fs.readFileSync("./public/ost-music.json", "utf-8")
);

musicRoute.use((req, res, next) => {
  console.log("/api ROUTE");
  next();
});

musicRoute.get("/", (req, res) => {
  const s = req.query.search;
  res.json(
    s ? ostMusics.filter((music) => music.title.includes(s)) : ostMusics
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
