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
          <p className="eyebrow">One place for tasks, schedules, school, files, and reminders.</p>
          <h1>See one clear next step at a time.</h1>
          <p className="welcomeLead">
            Squirrel! is a free web app that brings your calendar, courses, medications, tasks,
            and files together, then recommends one task that fits your available time and energy.
          </p>
          <div className="welcomeActions">
            <a href={chatGPTSignInPath("/dashboard")}>Sign in to Squirrel!</a>
            <span>Already signed in? Go directly to your dashboard.</span>
          </div>
          <p className="welcomePrivacy">Your information stays private to your account. Each user has a separate profile, calendar connection, classes, and files.</p>
        </div>

        <div className="welcomePreview" aria-label="Squirrel! recommended-task preview">
          <div className="welcomePreviewHeader">
            <span>Example Recommendation</span>
            <strong>One task that fits the time and energy you have.</strong>
            <small>Squirrel! recommends one useful task based on your time and energy. You can ask for an easier task at any time.</small>
          </div>
          <article className="welcomeAcornCard">
            <span>Recommended Next Task</span>
            <strong>Upload lecture notes</strong>
            <div className="welcomeAcornPills"><small>Medium energy</small><small>15 min</small><small>Medium mental effort</small></div>
            <p>Focus on one task before choosing another.</p>
            <div className="welcomeAcornActions"><b>Start Focus Mode</b><em>Show an easier task</em></div>
          </article>
        </div>
      </section>

      <section className="welcomeFeatureIntro">
        <p className="eyebrow">What Squirrel! Includes</p>
        <h2>Built for choosing, remembering, switching, and starting.</h2>
        <p>These tools share the same account and dashboard.</p>
      </section>

      <section className="welcomeFeatures" aria-label="What Squirrel! brings together">
        <article><span>01 · Medications</span><h2>Keep the exact medication type and dose together.</h2><p>Record the name, type, prescribed dose, instructions, refill date, and daily check-in. Immediate-release and extended-release versions stay separate.</p></article>
        <article><span>02 · Calendar</span><h2>See schedule conflicts before they cause a problem.</h2><p>Connect Google Calendar, review upcoming events, and add or change plans from the same dashboard.</p></article>
        <article><span>03 · School</span><h2>Search uploaded lecture files by name and contents.</h2><p>Organize courses by term, track assignments, and search lecture PDFs or PowerPoints by filename and text.</p></article>
        <article><span>04 · Display</span><h2>Choose how much information, color, and motion you see.</h2><p>Dark mode, higher contrast, reduced motion, text size, spacing, and color controls are saved to your profile.</p></article>
      </section>

      <section className="welcomeSincere" aria-label="Why Squirrel! exists">
        <p className="eyebrow">Why this exists</p>
        <h2>Designed to make planning, starting, and finishing tasks easier.</h2>
        <p>Squirrel! shows fewer choices at once, keeps reminders where you can find them, and turns a large task into a clear first step.</p>
      </section>

      <section className="welcomeClosing">
        <p>Keep tasks, plans, school materials, medication records, and reminders in one private place.</p>
        <h2>Let Squirrel! remember the details and show you what comes next.</h2>
        <a href={chatGPTSignInPath("/dashboard")}>Open Squirrel!</a>
        <small>Free to use during the Squirrel! public beta.</small>
      </section>
    </main>
  );
}
