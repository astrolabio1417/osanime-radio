import { Link } from 'react-router-dom'

import { Player } from './Player'

interface PlayerTopProps {
  title: string | null | undefined
  streamUrl: string | null
  controls?: React.ReactNode[]
}

export type { PlayerTopProps }

export default function PlayerTop(props: PlayerTopProps) {
  const { streamUrl, title } = props

  return (
    <div className="player-top">
      <div className="player-title">{title ?? '? ? ?'}</div>
      <div className="player-controls">
        <Player src={streamUrl ?? ''} reloadOnPlay={true} />
        {props?.controls?.map((node) => node)}
      </div>
    </div>
  )
}
