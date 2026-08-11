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
          <p className="eyebrow">External brain. Internal chaos.</p>
          <h1>Your brain has enough tabs open.</h1>
          <p className="welcomeLead">
            Squirrel! keeps the calendar, courses, tasks, files, and tiny obligations you were
            absolutely going to remember.
          </p>
          <div className="welcomeActions">
            <a href={chatGPTSignInPath("/dashboard")}>Sign in to Squirrel!</a>
            <span>Already signed in? Straight to the dashboard. No ceremonial button-clicking.</span>
          </div>
          <p className="welcomePrivacy">Your acorns stay yours. Everyone gets their own private profile, calendar, classes, and files.</p>
        </div>

        <div className="welcomePreview" aria-label="Squirrel! feature preview">
          <div className="welcomePreviewHeader">
            <span>Today, allegedly</span>
            <strong>One thing. Then the next suspiciously urgent thing.</strong>
          </div>
          <div className="welcomePreviewGrid">
            <article><span>Calendar</span><strong>Schedule without tab archaeology</strong><small>Your actual events, all in one place. Wild concept.</small></article>
            <article><span>School</span><strong>Course chaos, contained</strong><small>Terms, assignments, and lecture files.</small></article>
            <article><span>Display</span><strong>Less visual yelling</strong><small>Dark mode, higher contrast, and reduced motion.</small></article>
          </div>
        </div>
      </section>

      <section className="welcomeFeatures" aria-label="What Squirrel! brings together">
        <article><span>01</span><h2>Your brain is not a filing cabinet</h2><p>Squirrel! holds the dates, files, and follow-ups so you can use your brain for literally anything else.</p></article>
        <article><span>02</span><h2>Organization without the crashout</h2><p>Courses, assignments, and lecture files stay in one place—because we don’t have time to keep going back to the other room to remember why we went in there.</p></article>
        <article><span>03</span><h2>Settings that remember you</h2><p>Set your profile and display preferences once. Squirrel! keeps them, because that is the entire point.</p></article>
      </section>
    </main>
  );
}
