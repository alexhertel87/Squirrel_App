import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { add_new_med } from '../../store/meds_list';
import * as sessionActions from '../../store/session';
import * as userActions from '../../store/meds_list';
import Button from '../Button';
import MedsListForm from '../MedsList/MedsListForm';
import { NewMedModal } from '../NewMedModal/NewMed';
import {CurrMedsModal} from '../CurrentMedsModal/CurrentMeds';
import styles from './Dashboard.module.css';
import * as MedsListActions from '../../store/meds_list'
import MedsListData from '../CurrentMedsModal/MedsListData';

export const Dashboard = () => {

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(MedsListActions.all_active_meds());
    }, [dispatch]);

    return (
        <body className={styles.dashboard_body}>
            <div className={styles.dashboard_container}>
            <h1 className={styles.dashboard_header}>My Dashboard</h1>
                    <div className={styles.dashboard_box}>
                    <div className={styles.dashboard_item}>Add New Medication
                        <div className={styles.newMedModal}>
                            <NewMedModal />
                        </div>
                    </div>
                    <div className={styles.dashboard_item}>My Current Medications
                        <div>
                            <Link to="/dashboard/current_meds">
                            <button
                                text="View Current Medications"
                                className={styles.dash_med_button}
                                href="/dashboard/current_meds">
                                View Current Medications
                            </button>
                            </Link>
                        </div>
                    </div>

                    <div className={styles.dashboard_item}>Task List
                        <div>
                            <button text="placeholder" className={styles.dash_task_button }>placeholder</button>
                        </div>
                    </div>
                    <div className={styles.dashboard_item}>Completed Tasks
                        <div>
                            <button text="placeholder" className={styles.dash_task_button }>placeholder</button>
                        </div>
                    </div>
                </div>
            </div>
        </body>
)
}

export default Dashboard;
