import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";

// Renders the contact route for legal correspondence. Falls back to the Report form
// until NEXT_PUBLIC_CONTACT_EMAIL is configured.
export function ContactLine({ prefix = "Contact us" }: { prefix?: string }) {
  if (CONTACT_EMAIL) {
    return (
      <>
        {prefix} at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand underline">
          {CONTACT_EMAIL}
        </a>{" "}
        or through our{" "}
        <Link href="/report" className="text-brand underline">
          Report a review
        </Link>{" "}
        form.
      </>
    );
  }
  return (
    <>
      {prefix} through our{" "}
      <Link href="/report" className="text-brand underline">
        Report a review
      </Link>{" "}
      form.
    </>
  );
}
