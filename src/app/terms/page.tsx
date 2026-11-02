import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import BackToTop from "@/components/BackToTop";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The rules for using coci: accounts, content, conduct, liability and how disputes are handled.",
};

function H({ children }: { children: string }) {
  return (
    <h2 className="mt-8 font-display text-lg font-semibold">{children}</h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 leading-relaxed">{children}</p>;
}

export default function TermsPage() {
  const effective = "Effective date: October 30, 2026";
  return (
    <>
      <main id="pp-main" className="mx-auto max-w-2xl px-5 pb-24 pt-6 text-[15px]">
        <BackButton fallbackHref="/" label="Back home" />
        <h1 className="font-display text-3xl font-semibold">Terms of Service</h1>
        <p className="mt-2 text-sm text-mute">{effective}</p>

        <P>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your use of
          coci, a meal-planning web application owned and operated by the
          coci project team (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
          &ldquo;our&rdquo;). By creating an account, browsing, or using any
          part of coci, you agree to these Terms. If you do not agree, do
          not use the service.
        </P>

        <H>1. What coci does</H>
        <P>
          coci drafts day-by-day meal plans and shopping lists from the
          ingredients you already have, the budget you set, and the rules you
          choose. Plans are produced with the help of Google&rsquo;s Gemini
          model, are stored against your account, and can be shared publicly on
          the coci community board.          coci also hosts community chat
          spaces, a cooking assistant (&ldquo;Chef Pan&rdquo;), and small
          rewards like experience points, badges, streaks and leaderboards.
        </P>

        <H>2. Eligibility and accounts</H>
        <P>
          You must be at least 13 years old to create an account. If you are a
          minor, you must have your parent&rsquo;s or guardian&rsquo;s
          permission. You are responsible for keeping your password
          confidential and for all activity that happens under your account.
          Tell us right away if you believe someone else is using it. You may
          have only one account, and you may not transfer or sell accounts.
        </P>

        <H>3. Your content</H>
        <H>&ldquo;Your content&rdquo; means anything you submit: pantry lists, notes, saved plans, posts on the community board, chat messages, and display names.</H>
        <P>
          You keep ownership of your content. By submitting content that is
          visible to other users (community posts, chat messages, display
          names), you grant us a worldwide, royalty-free license to store,
          reproduce, adapt and display that content solely to operate
          coci. Content saved to your own account is private to you and
          only becomes public when you choose to share a plan.
        </P>
        <P>
          Content generated from your request (meal plans, shopping lists,
          Chef Pan replies) is provided for personal, non-commercial use. We
          make no claim that plans are nutritionally complete or that recipes
          are original. Always read a recipe fully before cooking it.
        </P>

        <H>4. Acceptable conduct</H>
        <P>
          You agree not to:
        </P>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            post content that is unlawful, hateful, harassing, sexually
            explicit, or that promotes violence, self-harm or illegal activity.
          </li>
          <li>Do not impersonate other people or brands in your display name or posts.</li>
          <li>
            Do not spam the board or chat, including advertising, chain messages and
            repeated identical posts.
          </li>
          <li>
            Do not attempt to scrape, overload, reverse-engineer, or bypass rate
            limits and security controls of the service.
          </li>
          <li>
            Do not access data that is not yours (for example, other users&rsquo;
            saved plans) through technical means.
          </li>
          <li>
            resell, sublicense or present coci as your own product.
          </li>
        </ul>
        <P>
          We may remove content and suspend or close accounts that break these
          rules. Moderators acting for us may remove posts and chat messages
          they judge to violate the rules, and we keep the right to do so
          ourselves. You can report problems by contacting us (Section 14).
        </P>

        <H>5. Availability and changes</H>
        <P>
          coci is provided as an ongoing service, but we cannot promise it
          will always be available, error-free, or uninterrupted. We may add,
          change or remove features, and we may suspend the service for
          maintenance. If we make a change that materially reduces what you can
          do, we will try to say so in the app first.
        </P>

        <H>6. Fees</H>
        <P>
          coci is free. If that changes, we will tell users in the app and
          by email before charging anything.
        </P>

        <H>7. Food and safety disclaimers</H>
        <P>
          Content in coci (plans, recipes, storage tips, Chef Pan
          replies) is general information, not medical or dietary
          advice. Always check ingredients against allergies, read recipes in
          full, follow safe cooking and storage practices, and consult a
          qualified professional for health or dietary decisions. We are not
          responsible for outcomes in your kitchen.
        </P>

        <H>8. Third-party services</H>
        <P>
          coci relies on third parties: Supabase (accounts, database,
          storage), Google (the Gemini model behind plan generation and Chef
          Pan), and hosting infrastructure such as Vercel and Cloudflare. Your
          use of those services is also subject to their terms. We are not
          responsible for third-party outages, policy changes or pricing.
        </P>

        <H>9. Termination</H>
        <P>
          You may stop using coci and ask us to delete your account at any
          time (Section 14). We may suspend or terminate your access if you
          break these Terms, if we are legally required to, or for reasons of
          security, abuse-prevention or fraud. Where practical, we will tell
          you why. Sections 3 (license), 7 (disclaimers), 10-13 (liability and
          disputes) survive termination.
        </P>

        <H>10. Disclaimer of warranties</H>
        <P>
          coci is provided &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; without warranties of any kind, whether express,
          implied or statutory, including implied warranties of
          merchantability, fitness for a particular purpose and
          non-infringement. We do not warrant that the service will be
          uninterrupted, accurate, or free of harmful components.
        </P>

        <H>11. Limitation of liability</H>
        <P>
          To the fullest extent allowed by law, we will not be liable for
          indirect, incidental, special, consequential or punitive damages, or
          for lost data, lost profits, or harm arising from food preparation,
          even if we knew a loss was possible. To the fullest extent allowed by
          law, our total liability to you for all claims is one hundred
          Philippine pesos (&#8369;100). Some jurisdictions do not allow some
          of these limits. In those places they apply up to the maximum the law
          permits.
        </P>

        <H>12. Indemnification</H>
        <P>
          You agree to compensate us for losses we suffer because you violated
          these Terms, misused the service, or submitted content that broke
          someone else&rsquo;s rights.
        </P>

        <H>13. Governing law and disputes</H>
        <P>
          These Terms are governed by the laws of the Republic of the
          Philippines. Any dispute will be brought in the courts of
          Bacoor/Cavite, Philippines, unless a consumer-protection law gives
          you the right to sue where you live. Before filing a claim, contact
          us and give us 30 days to try to fix the problem.
        </P>        <H>14. Contact</H>
        <P>
          Questions, reports and account-deletion requests go to the lead
          developer and data protection officer: {" "}
          <a className="underline decoration-line underline-offset-4" href="mailto:benjamesduag.edu@gmail.com">
            benjamesduag.edu@gmail.com
          </a>
          . See also our{" "}
          <Link
            href="/privacy"
            className="underline decoration-line underline-offset-4 hover:decoration-ink hover:decoration-2"
          >
            Privacy Policy
          </Link>
          .
        </P>

        <H>15. Changes to these Terms</H>
        <P>
          We may update these Terms. The effective date at the top shows the
          current version, and material changes will be announced in the app.
          Continuing to use coci after changes take effect means you
          accept the updated Terms.
        </P>
      </main>
      <BackToTop />
      <Footer />
    </>
  );
}
