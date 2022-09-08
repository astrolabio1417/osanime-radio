import {Headers} from 'node-fetch';

interface InterfaceRadioPlaylistItem {
  id: string;
  title: string;
  file: string;
  image?: string;
  headers?: Headers;
}

export {InterfaceRadioPlaylistItem};
