# Review takedown procedure (internal)

**Purpose.** Keep GC Reviews inside the digital intermediary exemption in the
*Defamation Act 2005 (Qld)* as amended in December 2025, and inside ACCC guidance on
online reviews. The exemption only holds if we run an accessible complaints mechanism
and remove or block access to the content **within 7 days of a valid complaint**, and
do not act with malice. Miss the window and we are liable as the publisher of the review.

This document is the procedure. The tooling that enforces it is `/admin/reports`.

## 1. Where complaints come from

| Channel | What happens |
|---|---|
| "Report this review" link under every review, or `/report` | Logged automatically in `review_reports` with `created_at` and a `due_at` of +7 days. Reporter gets an on-screen reference. |
| Email to the contact address | **Log it manually the same day** by submitting `/report` yourself with the complainant's details, then reply to them with the reference. The 7-day clock starts when the email arrived, not when you logged it. Note the original receipt time in the decision note. |
| Letter, DM, phone call | Same as email. Ask them to put it in writing, but log it immediately anyway. |
| Court order or eSafety removal notice | Act immediately. eSafety notices have a 24-hour deadline. Do not wait for the normal process. |

## 2. Daily check

Open `/admin/reports` every day, including weekends. Anything shown red is overdue,
amber is due within 48 hours. The admin dashboard shows the open count.

## 3. Is the complaint valid?

A complaint is valid when it:

1. identifies the review (link, venue plus reviewer name, or the snapshot on the report);
2. gives a working email address so we can respond;
3. says what is wrong with it in terms of the Review and Moderation Policy.

For a defamation complaint, "says what is wrong" means naming the statements claimed
to be false. "I don't like this review" or "this is bad for business" is not a valid
complaint. Reply within 2 days asking for the missing information, record that in the
decision note, and keep the report open. If they never respond, close as "kept" with a
note after 7 days.

## 4. Decide within 7 days

Work through this in order. Record what you checked in the decision note. The note is
the evidence that we acted reasonably and without malice.

1. **Read the review and the complaint.** Is the complaint about facts or opinion?
   "The steak was overcooked" is opinion. "The kitchen failed a health inspection" is a
   factual claim.
2. **Check the reviewer.** Account age, number of reviews, whether other reviews look
   genuine, whether the reviewer has multiple accounts on the same venue.
3. **For factual claims, ask the reviewer.** Email them the substance of the complaint
   (never the complainant's contact details) and give them 48 hours to respond or
   amend. Say that the review will be removed if we cannot verify the claim.
4. **Apply the policy.** Remove if the review is fake, undisclosed conflict, abusive,
   private information, wrong venue, or contains a factual claim the reviewer cannot
   stand behind. Keep if it is an honest opinion about a genuine visit, however
   negative.
5. **When in doubt on a defamation complaint, remove.** Loss of a single review costs
   us nothing. Losing the exemption costs us the whole case. Tell the reviewer why and
   invite them to post an amended review that sticks to their own experience.
6. **Click the decision in `/admin/reports`.** "Remove review" deletes it and closes the
   report as actioned. "Keep review" closes it as dismissed. Both stamp `resolved_at`.
7. **Email the complainant the outcome** the same day. Keep it short, state the decision
   and the policy ground. Do not argue the merits.

## 5. What we never do

- Never remove a review because it is negative, or because a venue is a friend,
  advertiser or partner.
- Never accept money or benefits to remove, edit or hide a review.
- Never edit a reviewer's words. Publish or remove.
- Never give a complainant the reviewer's identity, email or account details without a
  court order.
- Never delete the `review_reports` record. It is the audit trail.

## 6. Court orders and preliminary discovery

If a lawyer or court asks us to identify a reviewer, do not respond with any user data.
Forward it to our solicitor the same day. We only disclose under a court order, and then
only what the order specifies. Keep a copy of every order with the report.

## 7. Records

Reports are kept for seven years, including the review snapshot, the decision and the
note. This is our evidence that the complaints mechanism works and was followed.

## 8. Templates

**Acknowledgement**

> Thanks for your report (ref {id}). We received it on {date}. We assess reports against
> our Review and Moderation Policy and aim to decide within seven days. We will email you
> the outcome. We do not remove reviews simply because they are negative.

**Request for more detail**

> To assess your report we need you to tell us which specific statements in the review
> you say are untrue and why. Please reply by {date}. Without this we may not be able to
> act on the report.

**To the reviewer**

> A complaint has been made about your review of {venue}. The complaint says the
> following statements are untrue: {statements}. If you can stand behind these as your
> own genuine experience, please reply within 48 hours. If we do not hear from you, or
> cannot verify the claims, the review will be removed. You are welcome to post a new
> review that sticks to your own experience.

**Outcome, removed**

> We have reviewed your report (ref {id}) and removed the review under the
> {ground} section of our Review and Moderation Policy.

**Outcome, kept**

> We have reviewed your report (ref {id}). The review is an expression of the reviewer's
> own experience and does not breach our Review and Moderation Policy, so it stays
> published. You may respond publicly to the review, and you can contact us again if
> circumstances change.
