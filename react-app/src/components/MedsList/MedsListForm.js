import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { add_new_med } from '../../store/meds_list';
import * as sessionActions from '../../store/session';
import * as uesrActions from '../../store/meds_list';
import styles from './MedsListForm.module.css';

import Button from '../Button';

export const MedsListForm = ({ newMed }) => {
    const dispatch = useDispatch();
    const params = useParams();
    const user = useSelector(state => state.session.user);

    const [errors, setErrors] = useState([]);
    const [newMed, setNewMed] = useState('');

    const user_id = user?.id;

    const onSubmit = async (e) => {
        e.preventDefault();
        if (user_id) {
            setErrors([]);
            const data = {
                med_name: newMed?.med_name,
                dosage_mg: newMed?.dosage_mg,
                frequency: newMed?.frequency,
                taken: newMed?.taken,
                med_info: newMed?.med_info,
            }
            dispatch(userActions.add_new_med(data));
        }
        else {
            setErrors(['Please login to add a new med']);
        }
    }

    useEffect(() => {
        setErrors([]);
    }, [dispatch, user_id]);


    return (
        <div>
            <form className={styles.form} onSubmit={onSubmit}>

            </form>
        </div>
    )
