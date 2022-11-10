import { Link } from 'react-router-dom'

import PlayerContainer from '../components/PlayerContainer'
import { STREAM_URL } from '../config'
import { usePlaylistQueue } from '../hooks/usePlaylistQueue'

function Home() {
  const { queue } = usePlaylistQueue()

  function SearchButton() {
    return (
      <Link to="/search">
        <button
          className="player__button"
          title="search"
          style={{
            backgroundImage: 'url("/svg/search.svg")',
            backgroundSize: '1.5rem',
          }}
        ></button>
      </Link>
    )
  }

  return (
    <PlayerContainer
      top={{
        streamUrl: STREAM_URL,
        title: queue?.results && queue.results[0]?.title,
        controls: [<SearchButton key="search-button" />],
      }}
      body={{
        lists: queue?.results ?? [],
        listTitle: 'Queue',
      }}
    />
  )
}

export default Home
