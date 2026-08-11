import { redirect } from "next/navigation";
import Link from "next/link";
import { chatGPTSignInPath, getChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (await getChatGPTUser()) redirect("/dashboard");

  return (
    <main className="welcomePage">
      <header className="welcomeNav">
        <Link className="brand" href="/" aria-label="Squirrel! home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/squirrel_logo.png" alt="" className="brandLogo" />
          <span className="brandName welcomeBrand">Squirrel!</span>
        </Link>
        <a className="welcomeSignIn" href={chatGPTSignInPath("/dashboard")}>Sign in</a>
      </header>

      <section className="welcomeHero">
        <div className="welcomeCopy">
          <p className="eyebrow">For brains with 27 pages open.</p>
          <h1>One acorn. Not the whole forest.</h1>
          <p className="welcomeLead">
            Squirrel! is a free web app that brings your calendar, courses, medications, tasks,
            and files together—then gives you one next move instead of another list to negotiate with.
          </p>
          <div className="welcomeActions">
            <a href={chatGPTSignInPath("/dashboard")}>Sign in to Squirrel!</a>
            <span>Already signed in? Straight to your dashboard. No ceremonial button-clicking.</span>
          </div>
          <p className="welcomePrivacy">Your acorns stay yours. Everyone gets their own private profile, calendar, classes, and files.</p>
        </div>

        <div className="welcomePreview" aria-label="Squirrel! one-acorn engine preview">
          <div className="welcomePreviewHeader">
            <span>Today, allegedly</span>
            <strong>Your actual next move—not the entire backlog.</strong>
            <small>Squirrel! picks one useful acorn. Too much? Ask for something easier without rebuilding your whole day.</small>
          </div>
          <article className="welcomeAcornCard">
            <span>Do this next</span>
            <strong>Upload lecture notes</strong>
            <div className="welcomeAcornPills"><small>Medium energy</small><small>15 min</small><small>Brain: some</small></div>
            <p>One acorn. The rest can wait outside.</p>
            <div className="welcomeAcornActions"><b>Start Squirrel! Mode</b><em>Something easier</em></div>
          </article>
        </div>
      </section>

      <section className="welcomeFeatureIntro">
        <p className="eyebrow">The useful parts</p>
        <h2>Built for choosing, remembering, switching, and starting.</h2>
        <p>Not just storing more things in a prettier list.</p>
      </section>

      <section className="welcomeFeatures" aria-label="What Squirrel! brings together">
        <article><span>01 · Medications</span><h2>XR isn’t IR. Squirrel! knows the difference.</h2><p>Keep the medication, formulation, dose, and daily check-in together instead of flattening every prescription into “took pill.”</p></article>
        <article><span>02 · Calendar</span><h2>Spot the double-booking before it spots you.</h2><p>Bring in your Google Calendar, see what is sneaking up, and add or adjust plans without opening six more pages.</p></article>
        <article><span>03 · School</span><h2>Search the document—not your entire digital life.</h2><p>Organize courses by term, track assignments, and search lecture PDFs or PowerPoints by filename and contents.</p></article>
        <article><span>04 · Display</span><h2>Less visual yelling. Same useful information.</h2><p>Dark mode, higher contrast, reduced motion, and saved preferences make the dashboard easier to come back to.</p></article>
      </section>

      <section className="welcomeSincere" aria-label="Why Squirrel! exists">
        <p className="eyebrow">Why this exists</p>
        <h2>Built by someone with the same brain.</h2>
        <p>Squirrel! is shaped around the executive-function problems I actually run into—not around pretending a color-coded list will fix choosing paralysis.</p>
      </section>

      <section className="welcomeClosing">
        <p>For the ideas worth keeping, the plans worth protecting, and the medication formulation that absolutely matters.</p>
        <h2>You bring the genius, Squirrel! handles the rest.</h2>
        <a href={chatGPTSignInPath("/dashboard")}>Let&apos;s get Squirrelly!</a>
        <small>Free to use during the Squirrel! public beta.</small>
      </section>
    </main>
  );
}
