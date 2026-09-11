import './Modal.css'

function Modal({ open, children }) {
  if (!open) return null
  return (
    <div className="modal">
      <div className="modal__card">{children}</div>
    </div>
  )
}

export default Modal