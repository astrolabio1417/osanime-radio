import { useEffect, useState } from 'react'

import { HOST } from '../config'
import { Playlist } from '../types'

interface usePlaylistSearchProps {
  search: string
}

export function usePlaylistSearch(props: usePlaylistSearchProps) {
  const { search } = props
  const [result, setResult] = useState<Playlist | null>(null)

  useEffect(() => {
    fetch(`${HOST}/stream/search`)
      .then((res) => res.json())
      .then((data) => setResult(data ?? null))
  }, [search])

  return { result, setResult }
}
