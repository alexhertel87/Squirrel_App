import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useHistory } from 'react-router-dom';
import { add_new_med } from '../../store/meds_list';
import * as sessionActions from '../../store/session';
import * as userActions from '../../store/meds_list';
import styles from './MedsListForm.module.css';
import EditMedModal from '../EditMedModal/EditMedIndex';

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
    const history = useHistory();

    const user_id = user?.id;

    const onSubmit = async (e) => {
        // const history = useHistory();
        e.preventDefault();
        if (user_id) {
            setErrors([]);
            const data = {
                // user_id: userId,
                med_name: medName,
                dosage_mg: dosageMg,
                frequency: frequency,
                taken: taken,
                med_info: medInfo
            }
            dispatch(userActions.add_new_med(data));
            setShowModal(false);
        }
        else {
            setErrors(['Please login to add a new med']);
        }
        history.push('/dashboard/current_meds');
    }

    useEffect(() => {
        setErrors([]);
    }, [dispatch, user_id]);




    return (
        <div className={styles.form_container}>
            <h1 className={styles.newMedsHeader}>Add a New Medication</h1>
            <form
                className={styles.meds_form}
                onSubmit={onSubmit}>
                <div className={styles.new_meds_cont}>
                    <label htmlFor="medName" className={styles.newMedLabel}>
                        Medication Name:
                        <div className={styles.allInputs }>
                            <input
                                id="medName"
                                type="text"
                                name="medName"
                                onChange={(e) => {
                                    // debugger
                                    setMedName(e.target.value)
                                }
                                }
                                placeholder="  Enter name here"
                                value={medName}
                                className={styles.med_data_inputs}
                            ></input>
                        </div>
                    </label>
                    <label htmlFor="dosageMg" className={styles.newMedLabel}>
                        Dosage (mg):
                        <div>
                            <input
                                id="dosageMg"
                                type="text"
                                name="dosageMg"
                                onChange={(e) => setDosageMg(e.target.value)}
                                placeholder="  Enter dosage here"
                                value={dosageMg}
                                className={styles.med_data_inputs}
                            ></input>
                        </div>
                    </label>
                    <label htmlFor="frequency" className={styles.newMedLabel}>
                        How often do you take it?:
                        <div>
                            <input
                                id="frequency"
                                type="text"
                                name="frequency"
                                onChange={(e) => setFrequency(e.target.value)}
                                placeholder="  Enter frequency here"
                                value={frequency}
                                className={styles.med_data_inputs}
                            ></input>
                        </div>
                    </label>
                    <label htmlFor="medInfo" className={styles.newMedLabel}>
                        Medication Notes and Other Info:
                        <div>
                            <textarea
                                id="medInfo"
                                name="medInfo"
                                type="text"
                                onChange={(e) => setMedInfo(e.target.value)}
                                placeholder="  Enter notes here"
                                value={medInfo}
                                className={styles.med_info_text}
                            ></textarea>
                        </div>
                    </label >
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
