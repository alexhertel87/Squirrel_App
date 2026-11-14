"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { ChatGPTUser } from "./chatgpt-auth";

export type ProfilePreferences = {
  darkMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  density: "compact" | "comfortable" | "spacious";
  textScale: "small" | "medium" | "large";
  colorIntensity: "muted" | "soft" | "bright";
  notificationMode: "quiet" | "gentle" | "persistent";
  humorLevel: "low" | "some" | "full";
  timerDirection: "down" | "up";
};

type Profile = ProfilePreferences & {
  displayName: string;
  email: string;
  pronouns: string;
  timezone: string;
};

type Props = {
  user: ChatGPTUser;
  signOutPath: string;
  preferences: ProfilePreferences;
  onPreferences: (preferences: ProfilePreferences) => void;
};

export function AccountMenu({ user, signOutPath, preferences, onPreferences }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    displayName: user.displayName,
    email: user.email,
    pronouns: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago",
    ...preferences,
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(({ profile: saved }: { profile: Profile }) => {
        setProfile(saved);
        onPreferences(saved);
      })
      .catch(() => setMessage("Profile settings will be available after storage finishes connecting."));
  }, [onPreferences]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(profile),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Profile could not be saved.");
      setProfile(result.profile);
      onPreferences(result.profile);
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile.displayName || user.email).split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  const deleteData = async () => {
    if (deletePhrase !== "DELETE MY SQUIRREL DATA") return;
    setDeleting(true);
    setMessage("");
    try {
      const response = await fetch("/api/privacy/delete", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmation: deletePhrase }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Your data could not be deleted.");
      window.location.assign(signOutPath);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your data could not be deleted.");
      setDeleting(false);
    }
  };

  return (
    <div className="accountMenu" ref={menuRef}>
      <button className="accountButton" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className="accountAvatar">{initials}</span>
        <span className="accountButtonText"><strong>{profile.displayName}</strong><small>Settings</small></span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="accountPopover">
          <div className="accountIdentity"><strong>{profile.displayName}</strong><small>{user.email}</small></div>
          <button type="button" onClick={() => { setEditing(true); setOpen(false); }}>Edit Profile & Settings</button>
          <a href="#calendar" onClick={() => setOpen(false)}>Calendar Connection</a>
          <a href="#school" onClick={() => setOpen(false)}>Courses & Lecture Files</a>
          <a className="signOutLink" href={signOutPath}>Sign Out</a>
        </div>
      )}

      {editing && (
        <div className="modalBackdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setEditing(false);
        }}>
          <section className="profileModal" role="dialog" aria-modal="true" aria-labelledby="profile-heading">
            <div className="modalHeading">
              <div><p className="eyebrow">Your Squirrel!</p><h2 id="profile-heading">Profile & settings</h2></div>
              <button className="iconButton" type="button" aria-label="Close" onClick={() => setEditing(false)}>×</button>
            </div>
            <form className="profileForm" onSubmit={saveProfile}>
              <label className="field"><span>Display name</span><input required maxLength={80} value={profile.displayName} onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} /></label>
              <label className="field"><span>Email</span><input disabled value={profile.email} /><small>Managed by your sign-in account.</small></label>
              <div className="profileFormGrid">
                <label className="field"><span>Pronouns <small>(optional)</small></span><input maxLength={40} value={profile.pronouns} onChange={(event) => setProfile({ ...profile, pronouns: event.target.value })} /></label>
                <label className="field"><span>Time zone</span><input required maxLength={80} value={profile.timezone} onChange={(event) => setProfile({ ...profile, timezone: event.target.value })} /></label>
              </div>
              <fieldset className="preferenceFields">
                <legend>Sensory preferences</legend>
                <label><input type="checkbox" checked={profile.darkMode} onChange={(event) => setProfile({ ...profile, darkMode: event.target.checked })} /><span>Dark mode</span></label>
                <label><input type="checkbox" checked={profile.highContrast} onChange={(event) => setProfile({ ...profile, highContrast: event.target.checked })} /><span>Higher contrast</span></label>
                <label><input type="checkbox" checked={profile.reducedMotion} onChange={(event) => setProfile({ ...profile, reducedMotion: event.target.checked })} /><span>Reduce motion</span></label>
              </fieldset>
              <div className="preferenceSelectGrid">
                <label className="field"><span>Amount of information on screen</span><select value={profile.density} onChange={(event) => setProfile({ ...profile, density: event.target.value as ProfilePreferences["density"] })}><option value="compact">More, with less spacing</option><option value="comfortable">Standard</option><option value="spacious">Less, with more spacing</option></select></label>
                <label className="field"><span>Text size</span><select value={profile.textScale} onChange={(event) => setProfile({ ...profile, textScale: event.target.value as ProfilePreferences["textScale"] })}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label>
                <label className="field"><span>Color intensity</span><select value={profile.colorIntensity} onChange={(event) => setProfile({ ...profile, colorIntensity: event.target.value as ProfilePreferences["colorIntensity"] })}><option value="muted">Muted</option><option value="soft">Soft</option><option value="bright">Bright</option></select></label>
                <label className="field"><span>Reminder style</span><select value={profile.notificationMode} onChange={(event) => setProfile({ ...profile, notificationMode: event.target.value as ProfilePreferences["notificationMode"] })}><option value="quiet">Quiet</option><option value="gentle">Gentle</option><option value="persistent">Persistent</option></select></label>
                <label className="field"><span>Humor level</span><select value={profile.humorLevel} onChange={(event) => setProfile({ ...profile, humorLevel: event.target.value as ProfilePreferences["humorLevel"] })}><option value="low">Straightforward</option><option value="some">A little playful</option><option value="full">Full Squirrel!</option></select></label>
                <label className="field"><span>Focus timer</span><select value={profile.timerDirection} onChange={(event) => setProfile({ ...profile, timerDirection: event.target.value as ProfilePreferences["timerDirection"] })}><option value="down">Count down</option><option value="up">Count up</option></select></label>
              </div>
              <section className="privacyControls" aria-labelledby="privacy-heading">
                <div><h3 id="privacy-heading">Your Data</h3><p>Download a readable copy of your Squirrel! records. Calendar authorization secrets are never included.</p></div>
                <a className="exportButton" href="/api/privacy/export" download>Download My Data</a>
                <details>
                  <summary>Delete all Squirrel! data</summary>
                  <p>This permanently removes your profile, tasks, school records, uploaded files, medication logs, preferences, and calendar connection.</p>
                  <label className="field"><span>Type DELETE MY SQUIRREL DATA</span><input value={deletePhrase} onChange={(event) => setDeletePhrase(event.target.value)} /></label>
                  <button className="dangerButton" type="button" disabled={deleting || deletePhrase !== "DELETE MY SQUIRREL DATA"} onClick={() => void deleteData()}>{deleting ? "Deleting…" : "Delete All My Data"}</button>
                </details>
              </section>
              {message && <p className="formMessage" role="status">{message}</p>}
              <div className="modalActions"><button className="quietButton" type="button" onClick={() => setEditing(false)}>Close</button><button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
