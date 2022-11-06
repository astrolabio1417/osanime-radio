import { useRef, useState } from 'react'

import { PlayerBody } from '../components/PlayerBody'
import { HOST } from '../config'
import { Playlist } from '../types'

export function Search() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<Playlist | null>(null)

  function onSearch() {
    fetch(`${HOST}/stream/search?q=${inputRef?.current?.value ?? ''}`)
      .then((res) => res.json())
      .then((data) => setResult(data ?? null))
  }

  return (
    <div>
      <div className="search-container">
        <input
          id="search-input"
          placeholder="Search"
          ref={inputRef}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        ></input>
        <button className="primary-button" onClick={onSearch}>
          Search
        </button>
      </div>
      <PlayerBody listTitle={'Results'} lists={result?.results ?? []} />
    </div>
  )
}
