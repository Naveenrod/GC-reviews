import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section, Ul } from "@/components/LegalPage";
import { ContactLine } from "@/components/ContactLine";
import { LEGAL_ENTITY, MIN_AGE, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} collects, uses and protects your personal information.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This policy explains how ${LEGAL_ENTITY} ("we", "us") handles personal information when you use ${SITE_NAME}. We follow the Australian Privacy Principles in the Privacy Act 1988 (Cth) as a matter of practice, whether or not we are currently required to.`}
    >
      <Section title="1. What we collect">
        <p>
          <strong>Account information.</strong> When you sign in with Google or email we receive
          your email address, display name and, if you sign in with Google, your profile picture
          and a Google account identifier. We use Supabase to manage authentication.
        </p>
        <p>
          <strong>Reviews and content.</strong> The ratings, reviews, photos and other content you
          post, together with the time you posted them and the account they came from. Reviews
          are public and shown with your display name and profile picture.
        </p>
        <p>
          <strong>Reports.</strong> If you report a review we collect your name, email address,
          your relationship to the venue or review, the reason for the report and any details you
          give us.
        </p>
        <p>
          <strong>Technical information.</strong> Our hosting provider, Vercel, logs IP addresses,
          browser type, pages requested and timestamps for security and performance. We use
          essential cookies to keep you signed in. We do not currently use advertising cookies.
        </p>
        <p>
          <strong>Correspondence.</strong> Anything you send us by email or through our forms.
        </p>
      </Section>

      <Section title="2. How we use it">
        <Ul>
          <li>to run the Site, publish your reviews and show venue ratings;</li>
          <li>to let venue owners and others report reviews, and to investigate those reports;</li>
          <li>to detect and remove fake reviews, spam and abuse, including by comparing accounts;</li>
          <li>to respond to legal requests, including court orders to identify the author of a review;</li>
          <li>
            to feature reviews in our guides, emails and social media accounts, as described in
            the licence in our{" "}
            <Link href="/terms" className="text-brand underline">
              Terms of Use
            </Link>
            ;
          </li>
          <li>
            to send you service emails about your account or reviews. We only send marketing
            emails if you opt in, and every one includes an unsubscribe link, as required by the
            Spam Act 2003 (Cth).
          </li>
        </Ul>
      </Section>

      <Section title="3. Who we share it with">
        <p>We do not sell personal information. We share it only with:</p>
        <Ul>
          <li>
            <strong>Service providers</strong> that host and run the Site for us: Supabase
            (database and authentication), Vercel (hosting) and Google (sign-in and Google Maps
            Platform). Some of these providers store data outside Australia, including in the
            United States and Singapore.
          </li>
          <li>
            <strong>The public</strong>, in the case of your display name, profile picture and
            the reviews you choose to publish.
          </li>
          <li>
            <strong>Venues</strong>, only in the sense that your published review is visible to
            them like anyone else. We do not give venues your email address.
          </li>
          <li>
            <strong>Courts, regulators and law enforcement</strong> where required by law, for
            example under a court order for preliminary discovery in a defamation matter.
          </li>
        </Ul>
      </Section>

      <Section title="4. Google content and Google sign-in">
        <p>
          Venue listings on the Site are supplied by Google Maps Platform. Google&rsquo;s{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            Privacy Policy
          </a>{" "}
          applies to that content and to Google sign-in. We use the information Google provides
          at sign-in only to create and display your profile. We do not request access to your
          Google contacts, calendar, Drive or other data.
        </p>
      </Section>

      <Section title="5. Children">
        <p>
          The Site is not directed at children. You must be {MIN_AGE} or older to hold an account
          or post a review. If we learn that an account belongs to someone younger we will close
          it and delete the associated personal information.
        </p>
      </Section>

      <Section title="6. Security and retention">
        <p>
          Data is stored in access-controlled databases with row-level security, encrypted in
          transit and at rest by our providers. We keep account data while your account is open.
          Reviews you delete are removed from the Site immediately and from backups within 30
          days. We keep report records, including removed-review snapshots, for seven years so we
          can show how a complaint was handled.
        </p>
        <p>
          If a data breach is likely to cause serious harm, we will notify affected people and the
          Office of the Australian Information Commissioner.
        </p>
      </Section>

      <Section title="7. Your rights">
        <p>You can:</p>
        <Ul>
          <li>see and edit your display name and profile from your profile page;</li>
          <li>delete any review you have posted;</li>
          <li>ask us for a copy of the personal information we hold about you;</li>
          <li>ask us to correct it, or to delete your account and associated data;</li>
          <li>
            complain to us about how we have handled your information. If you are not satisfied
            with our response you can complain to the Office of the Australian Information
            Commissioner at oaic.gov.au.
          </li>
        </Ul>
        <p>We respond to requests within 30 days.</p>
      </Section>

      <Section title="8. Changes">
        <p>
          We may update this policy. The date at the top shows when it last changed. Material
          changes will be flagged on the Site.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>
          <ContactLine prefix="Privacy questions or requests? Contact us" />
        </p>
      </Section>
    </LegalPage>
  );
}
