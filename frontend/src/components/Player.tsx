import { useRef, useState } from 'react'

interface PlayerProps {
  src: string
  reloadOnPlay?: boolean
  showAudio?: boolean
}

export function Player(props: PlayerProps) {
  const radioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState<boolean | null>(false)
  const { src, reloadOnPlay, showAudio } = props
  const errors = {
    count: 0,
    max: 100,
  }

  function onClickPlay() {
    if (radioRef.current?.paused) {
      reloadOnPlay && radioRef.current?.load()
      radioRef.current?.play()
      return
    }
    radioRef.current?.pause()
  }

  function onError() {
    if (!src || errors.count >= errors.max) return
    errors.count++
    console.error('error!')
    radioRef.current?.load()
    radioRef.current?.play()
  }

  function onVolume(value: 'up' | 'down') {
    if (!radioRef.current) return

    if (value === 'up') {
      const newVolume = radioRef.current.volume - 0.1
      radioRef.current.volume = newVolume < 0.0 ? 0.0 : newVolume
      return
    }

    const newVolume = radioRef.current.volume + 0.2
    radioRef.current.volume = newVolume > 1.0 ? 1.0 : newVolume
  }

  return (
    <>
      <audio
        ref={radioRef}
        onPlaying={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsPlaying(null)}
        onError={onError}
        onEnded={onError}
        id="audio"
        controls
        src={src}
        preload="none"
        style={{
          display: showAudio ? 'block' : 'none',
        }}
      >
        <track kind="captions" />
      </audio>
      {!showAudio && (
        <>
          <button
            onClick={onClickPlay}
            className="player__button"
            id="play-pause"
            style={{
              backgroundImage: `url('${
                isPlaying === null
                  ? '/svg/loading.svg'
                  : isPlaying
                  ? '/svg/pause.svg'
                  : '/svg/play.svg'
              }')`,
              backgroundSize: '1.2rem',
            }}
          ></button>
          <button
            onClick={() => onVolume('up')}
            className="player__button"
            id="volume-down"
            title="volume down"
          ></button>
          <button
            onClick={() => onVolume('down')}
            className="player__button"
            id="volume-up"
            title="volume up"
          ></button>
        </>
      )}
    </>
  )
}
