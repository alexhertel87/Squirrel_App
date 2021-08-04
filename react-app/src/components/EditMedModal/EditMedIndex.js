import React, { useState } from 'react';
import { Modal } from '../../context/Modal';
import EditMedForm from './EditMedForm';
import styles from './EditMed.module.css'
// import styles from '../../Dashboard/Dashboard.module.css'


export const EditMedModal = ({med}) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className={styles.medFormContainer}>
            <button
                className={styles.dashboard_button}
                onClick={() => setShowModal(true)}>
                Edit Medication
            </button>
            {showModal && (
                <Modal onClose={() => setShowModal(false)}>
                    <EditMedForm med={med} setShowModal={setShowModal}/>
                </Modal>
            )
        }
    </div>
    )
}
export default EditMedModal;
