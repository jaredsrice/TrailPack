import Link from "next/link";

export const metadata = {
  title: "Data and privacy notes | TrailPack",
  description: "A plain-language summary of how the TrailPack academic project handles data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 sm:px-8">
      <Link href="/" className="text-sm font-semibold text-emerald-900 underline underline-offset-4">
        Back to TrailPack
      </Link>
      <header className="mt-8 border-b border-slate-200 pb-6">
        <p className="section-kicker">Academic project</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-950">Data and privacy notes</h1>
        <p className="mt-3 text-slate-700">
          This is a plain-language project notice, not an attorney-reviewed privacy policy or a compliance claim.
        </p>
      </header>

      <div className="mt-8 space-y-8 text-slate-700">
        <section aria-labelledby="guest-data-heading">
          <h2 id="guest-data-heading" className="text-xl font-semibold text-slate-950">Guest planning</h2>
          <p className="mt-2">
            Guest plans are generated in the browser. Trail popularity choices are stored on that device. TrailPack does not currently use analytics, advertising trackers, embeds, or nonessential cookies.
          </p>
        </section>

        <section aria-labelledby="account-data-heading">
          <h2 id="account-data-heading" className="text-xl font-semibold text-slate-950">Sign-in and saved plans</h2>
          <p className="mt-2">
            Google provides sign-in and Supabase manages the account session and saved plans. A saved plan contains the trail summary, trip details used by the packing rules, the recommendation, source labels, and creation time. Free-form notes are not saved.
          </p>
          <p className="mt-2">
            Signed-in users can delete one plan or every saved plan from the <Link href="/saved" className="font-semibold text-emerald-900 underline underline-offset-4">saved plans page</Link>. That action does not delete the Google or Supabase sign-in identity.
          </p>
        </section>

        <section aria-labelledby="ai-data-heading">
          <h2 id="ai-data-heading" className="text-xl font-semibold text-slate-950">Optional Gemini review</h2>
          <p className="mt-2">
            The rule-based packing list works without AI. A signed-in user who is 18 or older can explicitly request a Gemini review. TrailPack sends only approved trip facts and explanation choices. It does not send the user&apos;s name, email, or free-form notes. Google processes that request as the AI provider.
          </p>
        </section>

        <section aria-labelledby="providers-heading">
          <h2 id="providers-heading" className="text-xl font-semibold text-slate-950">Other services</h2>
          <p className="mt-2">
            Vercel hosts the website. TrailPack requests trail information from the National Park Service and forecast data from Open-Meteo. Links to outside sources follow those sites&apos; own privacy practices.
          </p>
        </section>

        <section aria-labelledby="retention-heading">
          <h2 id="retention-heading" className="text-xl font-semibold text-slate-950">Retention and unresolved release work</h2>
          <p className="mt-2">
            A 90-day saved-plan limit is the current proposed target, but automatic deletion is not active yet. TrailPack also does not yet provide in-app deletion of the sign-in identity. Both items require a verified database and account-deletion design before a broad public release.
          </p>
        </section>
      </div>
    </main>
  );
}
