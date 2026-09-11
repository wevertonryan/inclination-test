import './SegmentedControl.css'

function SegmentedControl({ options, value, onChange, label }) {
  return (
    <div className="segment" role="group" aria-label={label}>
      {options.map(({ id, label: text, Icon }) => (
        <button
          key={id}
          type="button"
          className={`segment__option ${value === id ? 'segment__option--active' : ''}`}
          onClick={() => onChange(id)}
          aria-pressed={value === id}
        >
          <Icon className="segment__icon" />
          <span className="segment__label">{text}</span>
        </button>
      ))}
    </div>
  )
}

export default SegmentedControl