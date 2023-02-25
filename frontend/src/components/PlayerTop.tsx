import { Player } from './Player'

interface PlayerTopProps {
  title: string | null | undefined
  streamUrl: string | null
  controls?: React.ReactNode[]
  showAudio?: boolean
}

export type { PlayerTopProps }

export default function PlayerTop(props: PlayerTopProps) {
  const { streamUrl, title, showAudio } = props

  return (
    <div className="player-top">
      <div className="player-title">{title ?? '? ? ?'}</div>
      <div className="player-controls">
        <Player src={streamUrl ?? ''} reloadOnPlay={true} showAudio={showAudio} />
        {props?.controls?.map((node) => node)}
      </div>
    </div>
  )
}
