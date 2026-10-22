import Icon from "./Icon"
import { Flash } from "../../context/AppContext"

export default function Toast({
  flash,
  dismiss,
}: {
  flash: Flash
  dismiss: () => void
}) {
  if (!flash) return null
  return (
    <div
      className={`toast ${flash.type}`}
      role={flash.type === "error" ? "alert" : "status"}
    >
      <Icon name={flash.type === "success" ? "check" : "close"} />
      <span>{flash.text}</span>
      <button onClick={dismiss} aria-label="Dismiss message">
        <Icon name="close" size={16} />
      </button>
    </div>
  )
}
