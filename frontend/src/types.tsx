export interface PlaylistItem {
  id: string
  title: string
  file: string
  image: string
  priority?: boolean
}

export interface Playlist {
  results: PlaylistItem[]
}
