import fetch, { Headers } from "node-fetch";
import { parse } from "node-html-parser";
import { pipeline } from "stream";
import { promisify } from "util";
import Fs from "fs";

async function saveFile(body, filename) {
  const writer = Fs.createWriteStream(filename);
  let success = true;
  writer.on("error", () => (success = false));
  await promisify(pipeline)(body, writer).catch((e) => e && (success = false));
  return success;
}

export class OsAnime {
  constructor() {
    this.name = "OS Anime";
    this.url = "https://osanime.com";
    this.headers = new Headers({
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
      referer: "https://osanime.com/",
    });
  }

  async list(page, sort = "newest") {
    const SORTING = {
      newest: "idl",
      asc: "nl",
      desc: "n",
    };

    sort = SORTING[sort] ?? "idl";
    const ostPageUrl = `${this.url}/page-lists/1/Ost-Anime/${sort}/${
      page || 1
    }`;
    const response = await fetch(ostPageUrl, {
      headers: this.headers,
    }).catch((e) => {
      console.log(e);
    });
    if (!response || !response.ok) return null;
    const html = await response.text();
    return this.listParser(html);
  }

  listParser(html) {
    const soup = parse(html);
    const article = soup.querySelector("article");
    const items = article.querySelectorAll("a", { rel: "bookmark" });
    const itemsJson = [];

    items.map((item) => {
      const title = item.attrs["title"];
      const image = item.querySelector("img");
      if (!title || !image) return;

      itemsJson.push({
        title: item.attrs["title"],
        url: item.attrs["href"],
        image: `https${image.attrs["src"]}`,
      });
    });

    return itemsJson;
  }

  getIdFromUrl(url) {
    return url.replace("https://osanime.com/site-down.html?to-file=", "");
  }

  async getMusicInfo(url) {
    const id = this.getIdFromUrl(url);
    const musicUrl = `https://osanime.com/site-down.html?to-file=${id}`;
    console.log(musicUrl, id);
    const response = await fetch(musicUrl, this.headers).catch((e) =>
      console.log(e)
    );
    if (!response || !response.ok) return null;
    const html = await response.text();
    const soup = parse(html);
    const source = soup.querySelector("source");
    return {
      source: `https:${source.attrs.src.toString()}`,
      cookies: this.cookieParser(response),
    };
  }

  async getMusicResponse(url) {
    const { source, cookies } = await this.getMusicInfo(url);
    const response = await fetch(source, {
      headers: new Headers({
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
        referer: url,
        range: "bytes=0-",
        "accept-encoding": "identity;q=1, *;q=0",
        Connection: "keep-alive",
        cookie: `osanime_com=${cookies["osanime_com"]}`,
      }),
    }).catch((e) => console.log(e));

    return response;
  }

  async downloader(url, filename) {
    if (Fs.existsSync(filename)) return filename;
    const response = await this.getMusicResponse(url);
    if (!response) return null;
    console.log(`Status ${response.status} | Downloading ${filename}`);
    if (!response.status === 206 || !(await saveFile(response.body, filename)))
      return null;
    return filename;
  }

  cookieParser(response) {
    const raw = response.headers.get("set-cookie");
    const cookies = {};

    raw.split("; ").map((entry) => {
      const split = entry.split("=");
      const name = split[0];
      const value = split[1];
      cookies[name] = value;
    });

    return cookies;
  }
}

async function ostDownloader() {
  const o = new OsAnime();
  let page = 1;
  const songList = [];

  while (true) {
    console.log(`Page: ${page} | Total: ${songList.length}`);
    const items = await o.list(page);
    if (!items) break;
    songList.push.apply(songList, items);
    page++;
  }

  Fs.writeFileSync("./anime-ost-list.json", JSON.stringify(songList));
  console.log("finished!");
  console.log(`Total: ${songList.length}`);
}

async function ostDownloaderMulti(limit = 10) {
  const o = new OsAnime();
  let page = 1;
  const limitFetch = limit;
  const songList = [];
  let totalPerMultiFetch = 1;

  while (totalPerMultiFetch) {
    console.log(
      `Page: ${page}-${page + limitFetch} | Total: ${songList.length}`
    );

    await Promise.all(
      [...Array(limitFetch)].map((_, i) => o.list(page + i))
    ).then((responses) => {
      const newList = [];

      responses.map((res) => {
        newList.push.apply(newList, res);
      });

      songList.push.apply(songList, newList);
      totalPerMultiFetch = newList.length;
    });

    page += limitFetch;
  }

  Fs.writeFileSync("./anime-ost-list.json", JSON.stringify(songList));
  console.log("finished!");
  console.log(`Total: ${songList.length}`);
}
