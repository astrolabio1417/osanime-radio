import { HOST } from '../config'
import { PlaylistItem } from '../types'
import PriorityButton from './PriorityButton'

interface PlayerBodyProps {
  listTitle: string
  lists: PlaylistItem[]
}

export type { PlayerBodyProps }

export function PlayerBody(props: PlayerBodyProps) {
  const { listTitle, lists } = props

  return (
    <div className="player-body">
      <h3>{listTitle}</h3>

      <div className="player-playlist">
        {lists.map((item, index) => (
          <div className="player-playlist-item" key={item?.id}>
            <a
              href={`/songs/${item?.id}/`}
              target="_blank"
              rel="noreferrer"
              style={{
                gridColumn: '1/2',
              }}
            >
              {index + 1}. {item?.title}
            </a>

            <div className="button-container">
              <a
                href={`${HOST}/stream/${item?.id}/download`}
                target="_blank"
                rel="noreferrer"
              >
                <button className="primary-button">Download</button>
              </a>
              {item?.priority !== true && <PriorityButton id={item?.id} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
