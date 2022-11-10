import { useParams } from 'react-router-dom'

import PlayerTop from '../components/PlayerTop'
import PriorityButton from '../components/PriorityButton'
import { HOST } from '../config'
import { usePlaylistSong } from '../hooks/usePlaylistSong'

export function Song() {
  const { songId } = useParams()
  const { data } = usePlaylistSong({ songId: songId ?? '' })

  const downloadUrl = `${HOST}/stream/${data?.id}/download`

  function DownloadButton() {
    return (
      <button
        className="player__button"
        title="download"
        onClick={() => (location.href = downloadUrl)}
        style={{
          backgroundImage: "url('/svg/download.svg')",
          backgroundSize: '1.5rem',
        }}
      />
    )
  }

  return (
    <div className="song__container">
      <PlayerTop
        title={data?.title}
        streamUrl={data ? downloadUrl : ''}
        controls={[<DownloadButton key="dl-button" />]}
      />
      {data?.priority !== true && (
        <PriorityButton key="priority-button" id={data ? data?.id : ''} />
      )}
    </div>
  )
}
