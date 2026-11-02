import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import BackToTop from "@/components/BackToTop";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What coci collects, why, who it goes to, how long it is kept, and the rights you have over it.",
};

function H({ children }: { children: string }) {
  return <h2 className="mt-8 font-display text-lg font-semibold">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 leading-relaxed">{children}</p>;
}

export default function PrivacyPage() {
  return (
    <>
      <main id="pp-main" className="mx-auto max-w-2xl px-5 pb-24 pt-6 text-[15px]">
        <BackButton fallbackHref="/" label="Back home" />
        <h1 className="font-display text-3xl font-semibold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-mute">
          Effective date: October 30, 2026
        </p>

        <P>
          This policy explains how coci (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;) handles personal data when you use our web app and
          services. It follows the Data Privacy Act of 2012 and its
          implementing rules (Republic Act No. 10173) in the Philippines, and
          is written to be plainly readable. By using coci you agree to
          this policy.
        </P>

        <H>1. Who is responsible</H>
        <P>
          coci is administered by the lead developer, Ben James Duag,
          who also acts as database administrator and data protection officer
          (DPO). Questions, complaints and deletion requests go to{" "}
          <a className="underline decoration-line underline-offset-4" href="mailto:benjamesduag.edu@gmail.com">
            benjamesduag.edu@gmail.com
          </a>
          .
        </P>

        <H>2. What we collect</H>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            <strong>Account data:</strong> email address, a display name, and a
            password kept only as a one-way hash. Google OAuth users also get
            their Google name, email and profile picture stored.
          </li>
          <li>
            <strong>Pantry and plan data:</strong> the ingredients, budgets,
            notes, days and rules you enter, the plans coci drafts for
            you, the plans you save, and shopping-list progress.
          </li>
          <li>
            <strong>Community data:</strong> plans you choose to share, titles,
            display names, likes you give or receive, and chat messages.
          </li>
          <li>
            <strong>Progress data:</strong> experience points, badges,
            streaks, plan-open counts and dates, tied to your account.
          </li>
          <li>
            <strong>Assistant data:</strong> the messages you send to Chef Pan,
            kept only for the length of your current chat session in your
            browser.
          </li>
          <li>
            <strong>Technical data:</strong> IP address and session tokens
            processed by our hosting and auth providers for security and
            fraud-prevention. We keep no analytics of your browsing beyond
            aggregate request logs held briefly by our host.
          </li>
        </ul>

        <H>3. Why we process it (and on what basis)</H>
        <P>
          To provide the service you asked for (performing our contract with
          you): making plans, storing your kitchen board, showing the community board,
          letting you like and post, computing your progress, and running Chef
          Pan. For keep-the-lights-on security (our legitimate interest):
          account protection, abuse and spam prevention, and keeping the board
          safe, including moderation actions by our volunteer moderators.
          Where law requires consent, we ask first and you may withdraw it
          anytime by deleting your account or content.
        </P>

        <H>4. Who sees your data</H>
        <P>
          Other users see only what you choose to make public: shared plans,
          your display name, your likes, chat messages, and leaderboard
          entries. Behind the scenes we use these processors, each bound by
          their own security terms:
        </P>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            <strong>Supabase (privacy@supabase.com):</strong> accounts,
           Postgres database, storage and email confirmation. Database access
            is protected by row-level security so users can only read what
            they are allowed to.
          </li>
          <li>
            <strong>Google (Gemini API):</strong> your pantry list, budget,
            notes and rules are sent to Gemini to draft plans and answer Chef
            Pan questions. Do not put a real name, phone number or other
            personal details in the pantry notes you type if you do not want
            them shared with Google.
          </li>
          <li>
            <strong>Vercel / Cloudflare (hosting):</strong> web serving,
            request logs and protection against attacks.
          </li>
        </ul>
        <P>
          We do not sell personal data. We do not use your data for
          advertising. We disclose data to authorities only when legally
          compelled, and we will contest requests we believe are improper.
        </P>

        <H>5. Where data lives</H>
        <P>
          Supabase hosts our database in Singapore (ap-southeast-1) and Gemini
          processes requests in Google&rsquo;s network. This means data leaves
          the Philippines. We rely on the security measures these providers
          publish, and everything moves over HTTPS.
        </P>

        <H>6. How we protect it</H>
        <P>
          Passwords are hashed by Supabase. Sessions use short-lived signed
          tokens. Database access runs through row-level security policies and
          security-definer functions. The Gemini key lives only on the server.
          Moderation and rate limits guard the community. No system is
          perfectly safe, so we encourage you to use a unique password.
          If a breach is likely to harm you, we will notify you and the
          National Privacy Commission as required by law.
        </P>

        <H>7. How long we keep it</H>
        <P>
          Account and plan data are kept until you delete your account or ask
          us to. Chat messages live in the room history until a moderator
          removes them.          Anonymized, non-personal aggregates (counts of plans made, popular
          ingredients) may be kept indefinitely.
        </P>

        <H>8. Your rights</H>
        <P>
          Under RA 10173 you can ask to see your data, correct it, delete it,
          object to processing, get a copy in a portable format, and complain
          to the National Privacy Commission. Delete your own content
          (plans, posts, likes) from the app any time. For your whole account,
          email{" "}
          <a className="underline decoration-line underline-offset-4" href="mailto:benjamesduag.edu@gmail.com">
            benjamesduag.edu@gmail.com
          </a>{" "}
          and we will delete it within 30 days and confirm.
        </P>

        <H>9. Children</H>
        <P>
          coci is not meant for children under 13. We delete accounts we
          learn belong to children under 13.
        </P>

        <H>10. Cookies and local storage</H>
        <P>
          We use one cookie-like item: your Supabase session token, kept in
          browser storage so you stay signed in. Your saved plans also live
          in browser storage as a device copy, so your kitchen still opens if
          the network drops. Plans, sharing and chat need a connection.
          Turning off storage in your browser signs
          you out and clears your saved plans from this device.
        </P>

        <H>11. Changes</H>
        <P>
          If this policy changes, the effective date above moves and we will
          say so in the app for material changes.
        </P>

        <P>
          See also our{" "}
          <Link
            href="/terms"
            className="underline decoration-line underline-offset-4 hover:decoration-ink hover:decoration-2"
          >
            Terms of Service
          </Link>
          .
        </P>
      </main>
      <BackToTop />
      <Footer />
    </>
  );
}
