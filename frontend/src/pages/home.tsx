import PlayerContainer from '../components/PlayerContainer'
import { STREAM_URL } from '../config'
import { usePlaylistQueue } from '../hooks/usePlaylistQueue'

function Home() {
  const { queue } = usePlaylistQueue()

  return (
    <PlayerContainer
      top={{
        streamUrl: STREAM_URL,
        title: queue?.results ? queue.results[0].title : null,
      }}
      body={{
        lists: queue?.results ?? [],
        listTitle: 'Queue',
      }}
    />
  )
}

export default Home
