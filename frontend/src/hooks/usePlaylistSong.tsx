import { useEffect, useState } from 'react'

import { HOST } from '../config'
import { PlaylistItem } from '../types'

export function usePlaylistSong(props: { songId: string }) {
  const [data, setData] = useState<PlaylistItem>()
  const { songId } = props

  async function getData(): Promise<PlaylistItem> {
    const response = await fetch(`${HOST}/stream/${songId}`)
    const json: PlaylistItem = await response.json()
    console.log(json)
    return json
  }

  useEffect(() => {
    ;(async () => {
      setData(await getData())
    })()
  }, [songId])

  return { data, setData }
}
