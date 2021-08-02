import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { add_new_med } from '../../store/meds_list';
import * as sessionActions from '../../store/session';
import * as userActions from '../../store/meds_list';
import styles from './MedsListForm.module.css';

import Button from '../Button';

export const MedsListForm = ({setShowModal}) => {
    const dispatch = useDispatch();
    const params = useParams();
    const user = useSelector(state => state.session.user);

    const [errors, setErrors] = useState([]);
    const [medName, setMedName] = useState('');
    const [dosageMg, setDosageMg] = useState('');
    const [taken, setTaken] = useState(false);
    const [frequency, setFrequency] = useState('');
    const [medInfo, setMedInfo] = useState('');

    const user_id = user?.id;

    const onSubmit = async (e) => {
        e.preventDefault();
        if (user_id) {
            setErrors([]);
            const data = {
                med_name: medName,
                dosage_mg: dosageMg,
                frequency: frequency,
                taken: taken,
                med_info: medInfo,
            }
            dispatch(userActions.add_new_med(data));
            setShowModal(false);
        }
        else {
            setErrors(['Please login to add a new med']);
        }
    }

    useEffect(() => {
        setErrors([]);
    }, [dispatch, user_id]);




    return (
        <div className={styles.form_container}>
            <h1>Add a New Medication</h1>
            <form
                className={styles.meds_form}
                onSubmit={onSubmit}>
                <div >
                    <label htmlFor="medName">
                        Medication Name:
                        <input
                            id="medName"
                            type="text"
                            name="medName"
                            onChange={(e) => setMedName(e.target.value)}
                            placeholder="  Enter name here"
                            value={medName}
                            className={styles.med_data_inputs}
                        ></input>
                    </label>
                    <label htmlFor="dosageMg">
                        Dosage (mg):
                        <input
                            id="dosageMg"
                            type="text"
                            name="dosageMg"
                            onChange={(e) => setDosageMg(e.target.value)}
                            placeholder="  Enter dosage here"
                            value={dosageMg}
                            className={styles.med_data_inputs}
                        ></input>
                    </label>
                    <label htmlFor="frequency">
                        How often do you take it?:
                        <input
                            id="frequency"
                            type="text"
                            name="frequency"
                            onChange={(e) => setFrequency(e.target.value)}
                            placeholder="  Enter frequency here"
                            value={frequency}
                            className={styles.med_data_inputs}
                        ></input>
                    </label>
                    <label htmlFor="medInfo">
                        Medication Notes and Other Info:
                        <textarea
                            id="medInfo"
                            name="medInfo"
                            type="text"
                            onChange={(e) => setMedInfo(e.target.value)}
                            placeholder="  Enter notes here"
                            value={medInfo}
                            className={styles.med_info_text}
                        ></textarea>
                    </label>
                        <div>
                        <button
                            type="submit"
                            className={styles.submit_button}>
                            <Button
                                text={"Add New Medication"}
                                action={onSubmit} />
                            </button>
                        </div>
                        <div className={styles.errorsContainer}>
                        {errors?.map((error, ind) => (
                        <div className={styles.error} key={ind}>{error}</div>
                     ))}
                        </div>
                </div>
            </form>
        </div>
    );
}
    export default MedsListForm;
