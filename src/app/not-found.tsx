import { StatusPage } from "@/components/layout/status-page";

export default function NotFound() {
  return (
    <main id="main">
      <StatusPage
        code="404"
        title="We couldn't find that page"
        description="The page may have moved, or the link might be incomplete. Let's get you back on the path."
      />
    </main>
  );
}
