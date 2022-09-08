import fetch, { Headers } from "node-fetch";
import Express from "express";
import fs from "fs";
import { ffprobe } from "@dropb/ffprobe";
import Throttle from "throttle";
import { OsAnime } from "./osanime";
import { InterfaceRadioPlaylistItem } from "../@types/express-radio";

class ExpressRadio {
  playlists: InterfaceRadioPlaylistItem[];
  defaultHeaders: Headers;
  errors: number;
  max_errors: number;
  clients: Express.Response[];
  priorities: number;

  constructor(playlists: InterfaceRadioPlaylistItem[] = []) {
    this.playlists = playlists;
    this.defaultHeaders = new Headers({
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
      Connection: "keep-alive",
    });
    this.errors = 0;
    this.max_errors = 2;
    this.clients = [];
    this.priorities = 0;
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

  searchById(id: string) {
    const searchIndex = this.playlists.findIndex((item) => item?.id === id);
    return {
      result: searchIndex === -1 ? null : this.playlists[searchIndex],
      index: searchIndex,
    };
  }

  searchByTitle(q: string = "") {
    return this.playlists.filter(
      (item) => item.title.includes(q) || item.file.includes(q)
    );
  }

  addToPriority(id: string): InterfaceRadioPlaylistItem | number {
    /*
      return: number || item
        -1 = Not Found
        -2 = Already in priority
    */
    const { result, index } = this.searchById(id);
    if (index === -1) return -1;
    if (index <= this.priorities) return -2;
    const get = this.playlists.splice(index, 1);
    this.priorities++;
    this.playlists.splice(this.priorities, 0, get[0]);
    return get[0];
  }

  async createReadStream(
    item: InterfaceRadioPlaylistItem
  ): Promise<NodeJS.ReadableStream | null> {
    const isHttp = item?.file.startsWith("http");

    if (!isHttp) {
      if (!fs.existsSync(item.file)) return null;
      return fs.createReadStream(item.file);
    }
    const response = await fetch(item?.file, {
      headers: item?.headers ?? this.defaultHeaders,
    });
    return response.body;
  }

  playlistRotate() {
    this.priorities && this.priorities--;
    const current = this.playlists.shift();
    current && this.playlists.splice(this.playlists.length - 1, 0, current);
  }

  addClient(response: Express.Response) {
    this.clients.push(response);
  }

  removeClient(response: Express.Response) {
    const clientIdex = this.clients.findIndex((res) => res === response);
    if (clientIdex === -1) return false;
    console.log(`Client ${clientIdex} has been disconnected!`);
    this.clients.splice(clientIdex, 1);
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
    throttler.on("data", (chunk) => this.clients.map((r) => r.write(chunk)));
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
    const { file, title } = item;
    console.log("Creating readstream...");

    if (file.startsWith("https://osanime.com/site-down.html?to-file=")) {
      console.log("Getting file info...", title);
      const { source } = (await this.osanime.getMusicInfo(file)) || {};
      let url = source ?? file;

      if (source?.startsWith("https://osanime.com/filedownload/")) {
        console.log("Getting redirect url...");
        url = (await this.osanime.getRedirect(source)) ?? file;
        console.log(`Redirect url of ${source} is ${url}`);
      }

      item.file = url;
      item.headers = new Headers({
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
        referer: item.file,
        range: "bytes=0-",
        Connection: "keep-alive",
      });
    }

    return super.createReadStream(item);
  }
}

export {
  InterfaceRadioPlaylistItem as IplaylistItem,
  OsAnimeRadio,
  ExpressRadio,
};
