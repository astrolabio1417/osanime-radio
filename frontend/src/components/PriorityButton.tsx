import { HOST } from '../config'

interface PriorityButtonProps {
  id: string
  className?: string
}

export default function PriorityButton(props: PriorityButtonProps) {
  return (
    <button
      className={props?.className ?? 'primary-button'}
      onClick={() => {
        fetch(`${HOST}/stream/add-to-priority`, {
          method: 'post',
          body: JSON.stringify({
            id: props.id,
          }),
          headers: {
            'content-type': 'application/json',
          },
        })
          .then((res) => res.json())
          .then((data) =>
            alert(`${data?.result?.title ? 'added to priority list!' : data?.message}`),
          )
      }}
    >
      Add to priority
    </button>
  )
}
