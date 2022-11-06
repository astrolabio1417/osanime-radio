import { Link } from 'react-router-dom'

import { Player } from './Player'

interface PlayerTopProps {
  title: string | null
  streamUrl: string | null
}

export type { PlayerTopProps }

export default function PlayerTop(props: PlayerTopProps) {
  const { streamUrl, title } = props

  return (
    <div className="player-top">
      <div className="player-title">{title ?? '? ? ?'}</div>
      <div className="player-controls">
        <Player src={streamUrl ?? ''} reloadOnPlay={true} />
        <Link to="/search">
          <button className="player-button">
            <img src="./svg/search.svg" alt="search" />
          </button>
        </Link>
      </div>
    </div>
  )
}
