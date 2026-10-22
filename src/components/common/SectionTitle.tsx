import { ReactNode } from "react"

export default function SectionTitle({
  eyebrow,
  children,
  aside,
}: {
  eyebrow?: string
  children: ReactNode
  aside?: ReactNode
}) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{children}</h2>
      </div>
      {aside}
    </div>
  )
}
