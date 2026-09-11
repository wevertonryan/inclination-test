import './Modal.css'

function Modal({ open, children, onClose, backdrop = true }) {
  if (!open) return null
  return (
    <div
      className={`modal ${backdrop ? '' : 'modal--bare'}`}
      onClick={onClose}
    >
      <div className="modal__card" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export default Modal