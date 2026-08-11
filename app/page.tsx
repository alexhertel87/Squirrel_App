import { redirect } from "next/navigation";
import Link from "next/link";
import { chatGPTSignInPath, getChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (await getChatGPTUser()) redirect("/dashboard");

  return (
    <main className="welcomePage">
      <header className="welcomeNav">
        <Link className="brand" href="/" aria-label="Squirrel home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/squirrel_logo.png" alt="" className="brandLogo" />
          <span className="brandName welcomeBrand">Squirrel!</span>
        </Link>
        <a className="welcomeSignIn" href={chatGPTSignInPath("/dashboard")}>Sign in</a>
      </header>

      <section className="welcomeHero">
        <div className="welcomeCopy">
          <p className="eyebrow">A calmer place to land</p>
          <h1>Your day does not have to live entirely in your head.</h1>
          <p className="welcomeLead">
            Bring your calendar, courses, assignments, lecture files, routines, and gentle
            reminders together in one private dashboard designed to reduce friction.
          </p>
          <div className="welcomeActions">
            <a href={chatGPTSignInPath("/dashboard")}>Sign in to Squirrel</a>
            <span>Your personal dashboard opens automatically when you are already signed in.</span>
          </div>
          <p className="welcomePrivacy">Private by default. Each person only sees their own profile, calendar, classes, and files.</p>
        </div>

        <div className="welcomePreview" aria-label="Squirrel feature preview">
          <div className="welcomePreviewHeader">
            <span>Today, gently</span>
            <strong>One next step at a time</strong>
          </div>
          <div className="welcomePreviewGrid">
            <article><span>Calendar</span><strong>Google connected</strong><small>Upcoming events, without tab hopping</small></article>
            <article><span>School</span><strong>Courses by term</strong><small>Assignments and lecture files together</small></article>
            <article><span>Sensory</span><strong>Your display, your way</strong><small>Dark, higher contrast, and reduced motion</small></article>
          </div>
        </div>
      </section>

      <section className="welcomeFeatures" aria-label="What Squirrel brings together">
        <article><span>01</span><h2>Remember less</h2><p>Let Squirrel hold the dates, files, and follow-ups so working memory can breathe.</p></article>
        <article><span>02</span><h2>Organization without the crashout</h2><p>Courses, assignments, and lecture files stay in one place—because we don’t have time to keep going back to the other room to remember why we went in there.</p></article>
        <article><span>03</span><h2>Make it yours</h2><p>Edit your profile, choose sensory preferences, and connect only the services you want.</p></article>
      </section>
    </main>
  );
}
