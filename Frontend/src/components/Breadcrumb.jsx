export default function Breadcrumb({ items = ['My files', 'Overview'], onNavigate }) {
  return <div className="crumb">{items.map((item, index) => <span key={item}><button onClick={() => onNavigate?.(item)}>{item}</button>{index < items.length - 1 && <b> / </b>}</span>)}</div>
}