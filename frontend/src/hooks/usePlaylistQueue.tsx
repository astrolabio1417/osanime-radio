import { useEffect, useState } from 'react'

import { QUEUE_URL } from '../config'
import { Playlist } from '../types'

async function getQueue(): Promise<Playlist> {
  const response = await fetch(QUEUE_URL)
  const json: Playlist = await response.json()
  return json
}

export function usePlaylistQueue() {
  const [queue, setQueue] = useState<Playlist | null>()

  useEffect(() => {
    document.title = 'Anime Radio'
    let waiting = false

    const polling = setInterval(async () => {
      if (waiting) return console.log('waiting...')
      waiting = true
      setQueue(await getQueue().catch(() => null))
      waiting = false
    }, 2000)

    return () => {
      clearInterval(polling)
    }
  }, [])

  return { queue, setQueue }
}
