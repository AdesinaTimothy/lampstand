"use client";

// Last-resort boundary (root layout failed). Keep it dependency-free.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#fbfaf7", color: "#18211e", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <main style={{ textAlign: "center", padding: 24, maxWidth: 420 }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 500, fontSize: 32 }}>We hit a problem</h1>
          <p style={{ color: "#5c6863", lineHeight: 1.6 }}>Lampstand couldn&apos;t load. Please refresh in a moment.</p>
          <button onClick={reset} style={{ marginTop: 16, background: "#1f5145", color: "#fff", border: 0, borderRadius: 8, padding: "10px 18px", fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
