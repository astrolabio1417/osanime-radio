import { useParams } from 'react-router-dom'

import { Player } from '../components/Player'
import { HOST } from '../config'
import { usePlaylistSong } from '../hooks/usePlaylistSong'

export function Song() {
  const { songId } = useParams()
  const { data } = usePlaylistSong({ songId: songId ?? '' })

  const downloadUrl = `${HOST}/stream/${data?.id}/download`

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '80vh',
      }}
    >
      <div className="player">
        <div className="player-top">
          <div className="player-title">{data?.title ?? 'loading...'}</div>
          <div className="player-controls">
            <Player src={data ? downloadUrl : ''} showAudio={false} />
            {data && (
              <a
                className="player-button"
                href={downloadUrl}
                target={'_blank'}
                rel="noreferrer"
              >
                <img src="/svg/download.svg" alt="download" title="download" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
