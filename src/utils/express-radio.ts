import fetch, { Headers } from "node-fetch";
import Express from "express";
import fs from "fs";
import { ffprobe } from "@dropb/ffprobe";
import Throttle from "throttle";
import { OsAnime } from "./osanime";
import { InterfaceRadioPlaylistItem } from "../@types/express-radio";

class ExpressRadio {
  connected: Express.Response[];
  playlists: InterfaceRadioPlaylistItem[];
  defaultHeaders: Headers;
  errors: number;
  max_errors: number;

  constructor(playlists: InterfaceRadioPlaylistItem[] = []) {
    this.playlists = playlists;
    this.connected = [];
    this.defaultHeaders = new Headers({
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
      Connection: "keep-alive",
    });
    this.errors = 0;
    this.max_errors = 2;
  }

  add(item: InterfaceRadioPlaylistItem): string | null {
    if (item?.file) return null;
    this.playlists.push(item);
    return item.file;
  }

  remove(item: InterfaceRadioPlaylistItem, filename?: string): boolean {
    const selected = this.playlists.findIndex(
      (i) => i == item || i.file == filename
    );
    return selected == -1 ? false : !!this.playlists.splice(selected, 1);
  }

  async createReadStream(
    item: InterfaceRadioPlaylistItem
  ): Promise<NodeJS.ReadableStream | null> {
    const isHttp = item?.file.includes("http");

    if (!isHttp) return fs.createReadStream(item.file);
    const response = await fetch(item?.file, {
      headers: item?.headers ?? this.defaultHeaders,
    });
    return response.body;
  }

  playlistRotate() {
    const current = this.playlists.shift();
    current && this.playlists.splice(this.playlists.length - 1, 0, current);
  }

  async play(): Promise<void> {
    if (this.playlists.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return this.play();
    }
    const selected = this.playlists[0];
    console.log(selected?.file);
    const readStream = await this.createReadStream(selected).catch((e) => {
      console.error(e, "readstream error");
      return null;
    });

    const ffprobeData = await ffprobe(selected.file).catch((e) => {
      console.error(e, "ffprobe error");
      return null;
    });
    console.log("BIT_RATE: ", ffprobeData?.format?.bit_rate);

    if (!readStream || !ffprobeData?.format?.bit_rate) {
      this.errors++;

      if (this.errors >= this.max_errors) {
        this.errors = 0;
        this.playlistRotate();
      }

      return this.play();
    }

    const bit_rate = parseInt(ffprobeData?.format?.bit_rate ?? "0");
    const throttler = new Throttle(bit_rate / 8);
    console.log("streaming started...");
    throttler.on("data", (chunk) =>
      this.connected.map((res) => res.write(chunk))
    );
    throttler.on("end", () => {
      this.playlistRotate();
      this.errors = 0;
      this.play();
    });
    readStream?.pipe(throttler);
  }
}

class OsAnimeRadio extends ExpressRadio {
  osanime: OsAnime;

  constructor(playlists: InterfaceRadioPlaylistItem[] = []) {
    super(playlists);
    this.osanime = new OsAnime();
  }

  async createReadStream(
    item: InterfaceRadioPlaylistItem
  ): Promise<NodeJS.ReadableStream | null> {
    console.log("creating readstream", item.title);

    if (item.file.includes("http")) {
      console.log("downloading...", item?.title);
      const getMp3Url = await this.osanime.getMusicInfo(item.file);
      item.file = getMp3Url?.source ?? item.file;
      item.headers = new Headers({
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
        referer: item.file,
        range: "bytes=0-",
        "accept-encoding": "identity;q=1, *;q=0",
        Connection: "keep-alive",
        cookie: `osanime_com=${getMp3Url?.cookies?.osanime_com}`,
      });
      console.log("downloaded");
    }
    return super.createReadStream(item);
  }
}

export {
  InterfaceRadioPlaylistItem as IplaylistItem,
  OsAnimeRadio,
  ExpressRadio,
};
