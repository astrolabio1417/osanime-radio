import express from "express";
import path from "path";
import musicRoute from "./routes/musicRoute";
import streamRoute from "./routes/streamRoute";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "../src/public")));
app.use(express.static(path.join(__dirname, "../src/views")));

app.get("/", (req, res) => {
  console.log("hellow fvcker");
  res.render("index.html");
});

app.use("/api/musics", musicRoute);
app.use("/stream", streamRoute);

app.listen(PORT, () => {
  console.log(`App is listening to ${PORT}`);
});
