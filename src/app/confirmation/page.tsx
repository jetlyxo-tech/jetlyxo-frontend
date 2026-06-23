"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

function ConfirmationPageContent() {
  const params = useSearchParams()

  const train = params.get("name")
  const price = params.get("price")

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Booking Confirmed</h1>
      <p>Train : {train}</p>
      <p>Amount Paid : INR {price}</p>
      <button onClick={() => window.print()}>
        Download Ticket
      </button>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", marginTop: "100px" }}>Loading...</div>}>
      <ConfirmationPageContent />
    </Suspense>
  )
}
