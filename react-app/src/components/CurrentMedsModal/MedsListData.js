import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { add_new_med } from '../../store/meds_list';
import * as sessionActions from '../../store/session';
import * as userActions from '../../store/meds_list';
import * as MedsListActions from '../../store/meds_list'
import EditMedModal from '../EditMedModal/EditMedIndex';
import { NewMedModal } from '../NewMedModal/NewMed';

export const MedsListData = () => {

    const meds = useSelector((state) => state.active_meds);

    const medsArray = Object.values(meds);

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(MedsListActions.all_active_meds());
    }, [dispatch]);


    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>Medication Name</th>
                        <th>Dosage (mg)</th>
                        <th>How often do you take this?</th>
                        <th>Medication Info & Notes</th>
                        {/* <th>Taken (Yes || No)</th> */}
                    </tr>
                </thead>
                <tbody>
                    {medsArray && medsArray.map(med => (
                        <tr>
                            <td>{med.med_name}</td>
                            <td>{med.dosage_mg}</td>
                            <td>{med.frequency}</td>
                            <td>{med.med_info}</td>
                            {/* <td>{med.taken}</td> */}
                            <EditMedModal med={med}/>
                            <button onClick={()=>dispatch(userActions.delete_active_med(med.id))}>Delete</button>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default MedsListData;
