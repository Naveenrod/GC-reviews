import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section, Ul } from "@/components/LegalPage";
import { ContactLine } from "@/components/ContactLine";
import { MIN_AGE, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Review & Moderation Policy",
  description: `How ${SITE_NAME} publishes, moderates and removes reviews, and how to report one.`,
  alternates: { canonical: "/review-policy" },
};

export default function ReviewPolicyPage() {
  return (
    <LegalPage
      title="Review & Moderation Policy"
      intro="Honest reviews only work if people can trust them. This page sets out, in plain terms, what we publish, what we remove, what we never do, and how to report a review. It follows the Australian Competition and Consumer Commission's guidance on online reviews."
    >
      <Section title="What a review must be">
        <Ul>
          <li>Based on your own genuine, first-hand experience of the venue.</li>
          <li>Written by a person who is {MIN_AGE} or older.</li>
          <li>One review per person per venue. You can edit or replace yours at any time.</li>
          <li>
            Free of any undisclosed benefit. If you received a free meal, discount, gift or
            payment connected to the visit, say so in the review.
          </li>
          <li>
            Free of any undisclosed conflict. Owners, staff, family of staff, and competitors
            must say so if they review.
          </li>
        </Ul>
      </Section>

      <Section title="What we remove">
        <p>We remove reviews that, in our reasonable judgement:</p>
        <Ul>
          <li>
            are fake, including reviews from accounts that have never visited, duplicate
            accounts, bought reviews, or coordinated campaigns for or against a venue;
          </li>
          <li>are written by the venue, its staff or a competitor without saying so;</li>
          <li>were incentivised without disclosure;</li>
          <li>
            make factual claims about a venue or person that are shown to be false, as opposed to
            expressing an honest opinion;
          </li>
          <li>
            contain abuse, threats, hate speech, discrimination, or sexual content;
          </li>
          <li>
            disclose someone&rsquo;s private information, such as a staff member&rsquo;s full
            name, phone number, home address or health details;
          </li>
          <li>are about a different venue, or are not about the venue at all;</li>
          <li>contain advertising, links or spam;</li>
          <li>are the subject of a court order.</li>
        </Ul>
      </Section>

      <Section title="What we never do">
        <Ul>
          <li>We never write reviews ourselves and publish them as member reviews.</li>
          <li>We never remove, hide or edit a review because it is negative.</li>
          <li>We never accept payment from a venue to remove, edit, hide or reorder reviews.</li>
          <li>We never edit the text or rating of a member&rsquo;s review. We publish it or remove it.</li>
          <li>
            We never let a commercial relationship affect a rating. If a venue ever pays us for
            featured placement, that placement will be clearly labelled.
          </li>
        </Ul>
      </Section>

      <Section title="How ratings are calculated">
        <p>
          A venue&rsquo;s member rating is the plain average of all published member ratings for
          that venue, shown to one decimal place, together with the number of reviews it is
          based on. Venues with no member reviews are shown as &ldquo;New&rdquo;. Ratings
          labelled &ldquo;on Google&rdquo; are Google&rsquo;s own ratings, shown separately for
          context, and are not combined with member ratings. Reviews are shown newest first.
        </p>
      </Section>

      <Section title="Incentives and competitions">
        <p>
          From time to time we may run competitions that reward people for reviewing. When we
          do, the reward is available regardless of whether the review is positive or negative,
          and reviews posted during the competition are published like any other. We do not run
          incentives on behalf of individual venues.
        </p>
      </Section>

      <Section title="How to report a review">
        <p>
          Anyone can report a review using the &ldquo;Report this review&rdquo; link under it, or
          through the{" "}
          <Link href="/report" className="text-brand underline">
            Report a review
          </Link>{" "}
          form. Tell us which review it is, who you are, your connection to the venue or review,
          and why you believe it breaches this policy. For a claim that a review is false or
          defamatory, tell us which specific statements are untrue and why.
        </p>
        <p>When we receive a report we will:</p>
        <Ul>
          <li>record the date and time it was received;</li>
          <li>acknowledge it by email;</li>
          <li>
            assess it against this policy and, where appropriate, give the reviewer a chance to
            respond;
          </li>
          <li>
            decide whether to keep, remove or temporarily hide the review, and tell you our
            decision, normally within seven days of receiving a complete report;
          </li>
          <li>keep a record of the report and the outcome.</li>
        </Ul>
        <p>
          A complete report includes a working email address, identifies the review, and
          explains which part of this policy it breaches. We may not be able to act on reports
          that do not.
        </p>
      </Section>

      <Section title="Venue owners: responding to reviews">
        <p>
          The best answer to a review you disagree with is usually a calm public response. We
          are building a verified owner-reply feature. Until it is live, you can report a review
          that breaches this policy, and you can ask us to add a note to your listing.
        </p>
      </Section>

      <Section title="Reviewer accounts">
        <p>
          We may suspend or close accounts that post fake, abusive or repeatedly removed reviews.
          Where a court orders us to, we may be required to disclose account details to identify
          the author of a review.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          <ContactLine prefix="Questions about this policy? Contact us" />
        </p>
      </Section>
    </LegalPage>
  );
}
