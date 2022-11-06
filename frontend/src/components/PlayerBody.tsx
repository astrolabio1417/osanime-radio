import { HOST } from '../config'
import { PlaylistItem } from '../types'

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
            <span style={{ paddingRight: '1rem' }}>{index + 1}</span>
            <a
              href={`${HOST}/stream/${item?.id}/download`}
              target="_blank"
              rel="noreferrer"
            >
              <button className="primary-button">Download</button>
            </a>
            {item?.priority !== true && (
              <button
                className="primary-button"
                onClick={() => {
                  fetch(`${HOST}/stream/add-to-priority`, {
                    method: 'post',
                    body: JSON.stringify({
                      id: item?.id,
                    }),
                    headers: {
                      'content-type': 'application/json',
                    },
                  })
                    .then((res) => res.json())
                    .then((data) => {
                      alert(
                        `${
                          data?.result?.title ? 'added to priority list!' : data?.message
                        }`,
                      )
                      data?.result?.title
                    })
                }}
              >
                Add to priority
              </button>
            )}
            {'  > '}
            <a href={`/songs/${item?.id}/`} target="_blank" rel="noreferrer">
              {item?.title}
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
