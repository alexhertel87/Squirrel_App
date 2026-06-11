import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as userActions from '../../store/meds_list';
import * as MedsListActions from '../../store/meds_list';
import EditMedModal from '../EditMedModal/EditMedIndex';
import { NewMedModal } from '../NewMedModal/NewMed';
import { getMedCheckins, medStatusLabel, saveJson, todayKey } from '../../utils/neuroSupport';
import styles from './CurrentMeds.module.css';

const checkinOptions = [
  { value: 'taken', label: 'Taken' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'unsure', label: 'Not sure' },
];

export const MedsListData = () => {
  const meds = useSelector((state) => state.active_meds);
  const medsArray = Object.values(meds).filter((med) => med && med.id);
  const dispatch = useDispatch();
  const [checkins, setCheckins] = useState(getMedCheckins);

  useEffect(() => {
    dispatch(MedsListActions.all_active_meds());
  }, [dispatch]);

  const updateCheckin = (medId, status) => {
    const nextCheckins = {
      ...checkins,
      [medId]: {
        status,
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      },
    };
    setCheckins(nextCheckins);
    saveJson(`squirrel-med-checkins-${todayKey()}`, nextCheckins);
  };

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Daily medication check-in</p>
          <h1>Current Medications</h1>
          <p>Choose what happened today. “Not sure” counts as useful information.</p>
        </div>
        <NewMedModal />
      </section>

      <section className={styles.grid}>
        {medsArray.length ? medsArray.map((med) => {
          const checkin = checkins[med.id];
          return (
            <article className={styles.card} key={med.id}>
              <div className={styles.cardHeader}>
                <div>
                  <h2>{med.med_name}</h2>
                  <p>{med.dosage_mg}mg · {med.frequency}</p>
                </div>
                <span className={`${styles.status} ${styles[checkin?.status || 'idle']}`}>
                  {medStatusLabel(checkin?.status)}
                </span>
              </div>

              {med.med_info && <p className={styles.notes}>{med.med_info}</p>}
              {checkin?.time && <p className={styles.time}>Last updated today at {checkin.time}</p>}

              <div className={styles.checkins}>
                {checkinOptions.map((option) => (
                  <button
                    className={checkin?.status === option.value ? styles.activeCheckin : ''}
                    key={option.value}
                    onClick={() => updateCheckin(med.id, option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className={styles.cardActions}>
                <EditMedModal med={med} />
                <button
                  onClick={() => dispatch(userActions.delete_active_med(med.id))}
                  className={styles.deleteButton}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </article>
          );
        }) : (
          <article className={styles.emptyState}>
            <h2>No medications yet</h2>
            <p>Add one medication to start building a daily memory support loop.</p>
          </article>
        )}
      </section>
    </main>
  );
};

export default MedsListData;
