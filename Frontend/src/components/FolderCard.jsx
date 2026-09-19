export default function FolderCard({ folder, onOpen, onMenu }) {
  return <button className="folder" onClick={() => onOpen?.(folder)}><i className="blue">~</i><span><strong>{folder.name}</strong><small>{folder.itemCount || 0} items - Updated recently</small></span><em onClick={event => { event.stopPropagation(); onMenu?.(folder) }}>...</em></button>
}