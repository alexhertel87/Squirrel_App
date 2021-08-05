import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { add_new_med } from '../../store/meds_list';
import * as sessionActions from '../../store/session';
import * as userActions from '../../store/meds_list';
import * as MedsListActions from '../../store/meds_list'
import EditMedModal from '../EditMedModal/EditMedIndex';
import { NewMedModal } from '../NewMedModal/NewMed';
import styles from './CurrentMeds.module.css'

export const MedsListData = () => {

    const meds = useSelector((state) => state.active_meds);

    const medsArray = Object.values(meds);

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(MedsListActions.all_active_meds());
    }, [dispatch]);


    return (
        <div className={styles.TableDiv}>
            <table>
                <thead className={styles.TableHeader}>
                    <tr className={styles.ColumnNames}>
                        <th className={styles.ColumnNames}>Medication Name</th>
                        <th className={styles.ColumnNames}>Dosage (mg)</th>
                        <th className={styles.ColumnNames}>How often do you take this?</th>
                        <th className={styles.ColumnNames}>Medication Info & Notes</th>
                        {/* <th>Taken (Yes || No)</th> */}
                    </tr>
                </thead>
                <tbody className={styles.TableBody}>
                    {medsArray && medsArray.map(med => (
                        <tr className={styles.medData}>
                            <td>{med.med_name}</td>
                            <td>{med.dosage_mg}</td>
                            <td>{med.frequency}</td>
                            <td>{med.med_info}</td>
                            {/* <td>{med.taken}</td> */}
                            <EditMedModal med={med} />
                            <button onClick={() => dispatch(userActions.delete_active_med(med.id))}
                                className={styles.med_btns}>Delete</button>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default MedsListData;
