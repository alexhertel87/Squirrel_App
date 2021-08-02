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
        <div className="dashboard">
            <h1 >Dashboard</h1>
            <div>Add a new medication to your list
                <NewMedModal />
            </div>
        </div>
)
}

export default Dashboard;
