import { Headers } from "node-fetch";

interface InterfaceRadioPlaylistItem {
  title: string;
  file: string;
  image?: string;
  headers?: Headers;
}

export { InterfaceRadioPlaylistItem };
