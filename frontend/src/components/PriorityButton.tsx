import { useState } from 'react'
import { toast } from 'react-toastify'

import { HOST } from '../config'
import { PlaylistItem } from '../types'

interface PriorityButtonProps {
  className?: string
  item?: PlaylistItem
}

export default function PriorityButton(props: PriorityButtonProps) {
  const [inPriority, setInPriority] = useState(!!props.item?.priority)
  const title = props.item?.title ?? 'no_title'

  return (
    <>
      <button
        className={`${props?.className ?? 'primary-button'}`}
        style={{ display: inPriority ? 'none' : 'block' }}
        onClick={() => {
          const priorityFetch = fetch(`${HOST}/stream/add-to-priority`, {
            method: 'post',
            body: JSON.stringify({
              id: props.item?.id,
            }),
            headers: {
              'content-type': 'application/json',
            },
          })
            .then((res) => res.json())
            .then((data) => {
              setInPriority(true)
              return data
            })

          toast.promise(priorityFetch, {
            pending: `Adding ${title} to priority list!`,
            success: {
              render({ data }) {
                return data?.message
                  ? `Already in priority list!`
                  : `${title} has been added to priority list!`
              },
            },
            error: `Error adding ${title} to priority list!`,
          })
        }}
      >
        Add to priority
      </button>
    </>
  )
}
