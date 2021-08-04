import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { add_new_med } from '../../store/meds_list';
import * as sessionActions from '../../store/session';
import * as userActions from '../../store/meds_list';
import Button from '../Button';
import MedsListForm from '../MedsList/MedsListForm';
import { NewMedModal } from '../NewMedModal/NewMed';
import styles from './Dashboard.module.css';

export const Dashboard = () => {

    return (
        <body className={styles.dashboard_body}>
            <div className={styles.dashboard_container}>
                <h1 className={styles.dashboard_header}>My Dashboard</h1>
                <div className={styles.dashboard_box}>
                    <div className={styles.dashboard_item}>Add a new medication to your list
                        <div className={styles.newMedModal}>
                            <NewMedModal />
                        </div>
                    </div>
                    <div className={styles.dashboard_item}>My Current Medications</div>
                        <div>
                            <button text="placeholder" className={styles.dashboard_button }>placeholder</button>
                        </div>
                    </div>
                    <div className={styles.dashboard_item}>Task List
                        <div>
                            <button text="placeholder" className={styles.dashboard_button }>placeholder</button>
                        </div>
                    </div>
                    <div className={styles.dashboard_item}>Completed Tasks
                        <div>
                            <button text="placeholder" className={styles.dashboard_button }>placeholder</button>
                        </div>
                    </div>
                </div>

        </body>
)
}

export default Dashboard;
