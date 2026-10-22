import {
  BorrowRequest,
  Item,
  OfferStatus,
  RequirementStatus,
  Transaction,
} from "../../store"

export default function Status({
  status,
  label,
}: {
  status: Item["availabilityStatus"] | Transaction["status"] | BorrowRequest["status"] | RequirementStatus | OfferStatus
  label?: string
}) {
  const text: Record<string, string> = {
    available: "Available now",
    reserved: "Reserved",
    borrowed: "Currently borrowed",
    pending: "Awaiting reply",
    approved: "Ready for handover",
    return_pending: "Return confirmation",
    returned: "Returned",
    rejected: "Declined",
    cancelled: "Cancelled",
    open: "Open",
    fulfilled: "Fulfilled",
    accepted: "Offer accepted",
    declined: "Offer declined",
  }
  return (
    <span className={`status ${status}`}>
      <i />
      {label || text[status] || status}
    </span>
  )
}
