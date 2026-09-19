import { useRef } from 'react'
export default function UploadDropzone({ onFiles, accept }) {
  const input = useRef(null)
  const handle = event => { event.preventDefault(); onFiles?.(Array.from(event.target.files || event.dataTransfer.files || [])) }
  return <div className="drop" onClick={() => input.current?.click()} onDragOver={event => event.preventDefault()} onDrop={handle}>^<b>Click to choose files or drop here</b><small>Choose any file from your computer</small><input ref={input} hidden type="file" multiple accept={accept} onChange={handle} /></div>
}