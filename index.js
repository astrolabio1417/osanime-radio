import Express from "express";
import musicRoute from "./routes/musicRoute.js";
import streamRoute from "./routes/streamRoute.js";
const app = Express();
const PORT = process.env.PORT || 3000;

app.use(Express.static("public"));
app.use(Express.static("views"));

app.get("/", (req, res) => {
  console.log("hellow fvcker");
  res.render("index.html");
});

app.use("/api/musics", musicRoute);
app.use("/stream", streamRoute);

app.listen(PORT, () => {
  console.log(`App is listening to ${PORT}`);
});
