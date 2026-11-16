import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section, Ul } from "@/components/LegalPage";
import { ContactLine } from "@/components/ContactLine";
import { LEGAL_ENTITY, MIN_AGE, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `The terms that apply when you use ${SITE_NAME}, post a review or book through the site.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro={`These terms govern your use of ${SITE_NAME} (the "Site"), operated by ${LEGAL_ENTITY} ("we", "us"). By using the Site you agree to them. If you do not agree, please do not use the Site.`}
    >
      <Section title="1. Who can use the Site">
        <p>
          You must be at least {MIN_AGE} years old to create an account, post a review or
          otherwise contribute content. By creating an account you confirm that you are{" "}
          {MIN_AGE} or older. We may close any account we reasonably believe belongs to someone
          younger. Anyone may browse the Site without an account.
        </p>
      </Section>

      <Section title="2. What the Site is">
        <p>
          The Site lists restaurants, hotels, cafes, bars, entertainment and things to do on the
          Gold Coast, in Brisbane and in other Australian locations we add over time. It lets
          members publish reviews and ratings and links you to venues so you can book directly
          with them.
        </p>
        <p>
          We are not a party to any booking, purchase or other arrangement between you and a
          venue. &ldquo;Book Now&rdquo; links take you to the venue&rsquo;s own website or
          booking provider. Their terms apply to that booking. We do not charge venues a
          commission for bookings made through those links.
        </p>
      </Section>

      <Section title="3. Reviews and member content">
        <p>
          Reviews, ratings, photos and other material that members post (&ldquo;Member
          Content&rdquo;) are the opinions of the people who post them, not ours. We do not
          verify Member Content before it is published. Our{" "}
          <Link href="/review-policy" className="text-brand underline">
            Review and Moderation Policy
          </Link>{" "}
          explains what is allowed, how we moderate and how to report a review.
        </p>
        <p>When you post Member Content you promise that:</p>
        <Ul>
          <li>it reflects your own genuine, first-hand experience of the venue;</li>
          <li>
            you have not been paid, given a free or discounted product or service, or offered
            any other benefit in exchange for posting it, unless you clearly say so in the
            review;
          </li>
          <li>
            you do not own, work for, or have a personal or commercial connection with the
            venue or a competitor of the venue, unless you clearly say so in the review;
          </li>
          <li>it is not false, misleading, defamatory, abusive, discriminatory or unlawful;</li>
          <li>
            it does not include anyone&rsquo;s private information, such as a staff
            member&rsquo;s full name, phone number or home address;
          </li>
          <li>you own, or have permission to use, any photos you upload.</li>
        </Ul>
      </Section>

      <Section title="4. Licence you grant us">
        <p>
          You keep ownership of your Member Content. So that we can run the Site, you grant us a
          worldwide, non-exclusive, royalty-free, perpetual, irrevocable, sublicensable and
          transferable licence to use, host, store, reproduce, adapt, translate, excerpt, publish,
          publicly display and distribute your Member Content, in whole or in part, in any media
          now known or later developed.
        </p>
        <p>This includes, for example:</p>
        <Ul>
          <li>showing your review and rating on the venue&rsquo;s page and in search results;</li>
          <li>
            quoting or excerpting your review, with your display name, in our guides, emails,
            social media accounts (including Instagram) and promotional material;
          </li>
          <li>using your photos alongside your review and in the venue&rsquo;s gallery;</li>
          <li>sharing Member Content with search engines and other services that index the Site.</li>
        </Ul>
        <p>
          You waive, to the extent permitted by law, any moral rights that would prevent us
          exercising this licence. You can delete your review at any time from your profile, and
          we will stop displaying it on the Site. Copies that have already been shared outside the
          Site, cached by search engines, or included in printed or published material may remain.
        </p>
      </Section>

      <Section title="5. Venue information and Google content">
        <p>
          Venue names, addresses, phone numbers, websites, opening details, photos, summaries
          and Google ratings are supplied by Google Maps Platform and are subject to the{" "}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            Google Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            Google Privacy Policy
          </a>
          . Ratings labelled &ldquo;on Google&rdquo; are Google&rsquo;s and are separate from
          member ratings. Venue details can change. Check with the venue before you travel or book.
        </p>
      </Section>

      <Section title="6. Our rights over the Site">
        <p>
          Everything on the Site other than Member Content and Google content, including the
          design, code, text, logos and the compilation of listings, belongs to us or our licensors.
          You may not copy, scrape, reproduce or build a database from the Site or its content
          without our written permission, except for personal, non-commercial browsing.
        </p>
      </Section>

      <Section title="7. Acceptable use">
        <p>You must not:</p>
        <Ul>
          <li>post fake reviews, or pay, pressure or incentivise others to post them;</li>
          <li>post multiple reviews of the same venue from different accounts;</li>
          <li>attempt to remove or suppress genuine negative reviews of your own business;</li>
          <li>harass, threaten or impersonate anyone;</li>
          <li>upload malware or interfere with the operation or security of the Site;</li>
          <li>use automated tools to access the Site, other than ordinary search engines.</li>
        </Ul>
        <p>
          We may remove content, suspend or close accounts and take other action we consider
          appropriate if these terms are breached.
        </p>
      </Section>

      <Section title="8. Venue owners">
        <p>
          If you own or manage a listed venue, you can report a review that you believe breaches
          these terms or our Review and Moderation Policy using the{" "}
          <Link href="/report" className="text-brand underline">
            Report a review
          </Link>{" "}
          form. We will not remove a review just because it is negative. We will not accept
          payment to remove, edit or hide a review.
        </p>
      </Section>

      <Section title="9. Australian Consumer Law and liability">
        <p>
          Nothing in these terms excludes, restricts or modifies any consumer guarantee, right or
          remedy under the Australian Consumer Law or any other law that cannot lawfully be
          excluded.
        </p>
        <p>
          To the extent permitted by law, the Site is provided &ldquo;as is&rdquo;. We do not
          guarantee that listings are accurate, complete or current, or that Member Content is
          truthful. We are not liable for any loss arising from your reliance on content on the
          Site, from a booking or purchase you make with a venue, or from Member Content posted
          by others. Where our liability cannot be excluded but can be limited, it is limited to
          resupplying the relevant service.
        </p>
      </Section>

      <Section title="10. Privacy">
        <p>
          Our{" "}
          <Link href="/privacy" className="text-brand underline">
            Privacy Policy
          </Link>{" "}
          explains what personal information we collect and how we handle it.
        </p>
      </Section>

      <Section title="11. Changes and termination">
        <p>
          We may update these terms from time to time. The date at the top shows when they last
          changed. Continuing to use the Site after a change means you accept the updated terms.
          You can close your account at any time. We may suspend or close accounts that breach
          these terms.
        </p>
      </Section>

      <Section title="12. Governing law">
        <p>
          These terms are governed by the laws of Queensland, Australia. You and we submit to the
          non-exclusive jurisdiction of the courts of Queensland and the Commonwealth of Australia.
        </p>
      </Section>

      <Section title="13. Contact">
        <p>
          <ContactLine prefix="Questions about these terms? Contact us" />
        </p>
      </Section>
    </LegalPage>
  );
}
