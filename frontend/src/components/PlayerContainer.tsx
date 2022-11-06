import { PlayerBody, PlayerBodyProps } from './PlayerBody'
import PlayerTop, { PlayerTopProps } from './PlayerTop'

interface PlayerContainerProps {
  top: PlayerTopProps
  body: PlayerBodyProps
}

export type { PlayerContainerProps }

export default function PlayerContainer(props: PlayerContainerProps) {
  const { top, body } = props

  return (
    <div className="player">
      <PlayerTop {...top} />
      <PlayerBody {...body} />
    </div>
  )
}
