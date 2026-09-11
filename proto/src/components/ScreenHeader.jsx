export function ScreenHeader({ left, title, right, hidden = false }) {
  return (
    <div className={`screen-header ${hidden ? 'screen-header--hidden' : ''}`}>
      <div className="screen-header__side">{left}</div>
      <h1 className="screen-header__title">{title}</h1>
      <div className="screen-header__side screen-header__side--right">{right}</div>
    </div>
  )
}

export function Placeholder({ text }) {
  return (
    <div className="placeholder">
      <p>{text}</p>
    </div>
  )
}