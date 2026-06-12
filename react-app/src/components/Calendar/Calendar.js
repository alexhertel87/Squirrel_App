import React, { useEffect, useState } from 'react';
import styles from './Calendar.module.css';

const providerCards = [
  {
    id: 'google',
    name: 'Google Calendar',
    action: 'Open Google Calendar',
    detail: 'Copy the private feed link, then add it from Google Calendar settings.',
    urlKey: 'googleUrl',
  },
  {
    id: 'outlook',
    name: 'Outlook Calendar',
    action: 'Open Outlook Calendar',
    detail: 'Use Add Calendar, then subscribe from web with your Squirrel link.',
    urlKey: 'outlookUrl',
  },
  {
    id: 'apple',
    name: 'Apple Calendar',
    action: 'Open Apple Calendar',
    detail: 'This uses a webcal link so the native Calendar app can subscribe.',
    urlKey: 'webcalUrl',
  },
];

export default function Calendar() {
  const [calendarInfo, setCalendarInfo] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const loadCalendarInfo = async () => {
    setLoading(true);
    setStatus('');

    try {
      const response = await fetch('/api/calendar/feed');
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.errors?.join(' ') || 'Calendar sync needs the Squirrel backend running.');
      }

      setCalendarInfo(payload);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarInfo();
  }, []);

  const copyFeedLink = async () => {
    if (!calendarInfo?.feedUrl) return;

    try {
      await navigator.clipboard.writeText(calendarInfo.feedUrl);
      setStatus('Private calendar link copied.');
    } catch (error) {
      setStatus('Copy did not work. Select the link below and copy it manually.');
    }
  };

  const resetPrivateLink = async () => {
    setLoading(true);
    setStatus('');

    try {
      const response = await fetch('/api/calendar/feed/reset', { method: 'POST' });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.errors?.join(' ') || 'Could not reset the private calendar link.');
      }

      setCalendarInfo(payload);
      setStatus('Private calendar link reset.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Calendar Sync</p>
        <h1>Bring Squirrel Into Your Calendar.</h1>
        <p>
          Subscribe once, then Squirrel can show task due dates and gentle med reminders
          in Google Calendar, Outlook, and Apple Calendar.
        </p>
      </section>

      {status && <p className={styles.status}>{status}</p>}

      <section className={styles.layout}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Private Feed</p>
              <h2>Your Squirrel Calendar Link</h2>
            </div>
            <span className={styles.eventCount}>
              {loading ? 'Loading' : `${calendarInfo?.eventCount || 0} Events`}
            </span>
          </div>

          <div className={styles.feedBox}>
            <code>{calendarInfo?.feedUrl || 'Calendar link loading...'}</code>
          </div>

          <div className={styles.buttonGrid}>
            <button disabled={!calendarInfo?.feedUrl || loading} onClick={copyFeedLink} type="button">
              Copy Feed Link
            </button>
            <a
              aria-disabled={!calendarInfo?.downloadUrl}
              href={calendarInfo?.downloadUrl || '#'}
              onClick={(event) => {
                if (!calendarInfo?.downloadUrl) event.preventDefault();
              }}
            >
              Download .ics
            </a>
            <button disabled={loading} onClick={resetPrivateLink} type="button">
              Reset Private Link
            </button>
          </div>

          <p className={styles.note}>
            Calendar subscriptions are one-way: Squirrel sends tasks and reminders out,
            and your calendar app refreshes them on its own schedule.
          </p>
        </article>

        <article className={styles.panel}>
          <p className={styles.eyebrow}>What Syncs</p>
          <h2>Included In The Feed</h2>
          <div className={styles.includeList}>
            {(calendarInfo?.includes || []).map((item) => (
              <div className={styles.includeItem} key={item.id}>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.enabled ? 'Included' : 'Off For Now'}</span>
                </div>
                <span className={styles.count}>{item.count}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.providerGrid} aria-label="Calendar providers">
        {providerCards.map((provider) => (
          <article className={styles.providerCard} key={provider.id}>
            <p className={styles.eyebrow}>{provider.name}</p>
            <h2>{provider.action}</h2>
            <p>{provider.detail}</p>
            <a
              href={calendarInfo?.[provider.urlKey] || '#'}
              onClick={(event) => {
                if (!calendarInfo?.[provider.urlKey]) event.preventDefault();
              }}
              rel="noreferrer"
              target={provider.id === 'apple' ? '_self' : '_blank'}
            >
              {provider.action}
            </a>
          </article>
        ))}
      </section>
    </main>
  );
}
