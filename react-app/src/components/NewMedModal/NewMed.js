import React, { useState } from 'react';
import { Modal } from '../../context/Modal';
import MedsListForm from '../MedsList/MedsListForm';
import styles from './NewMedForm.module.css'
// import styles from '../../Dashboard/Dashboard.module.css'


export const NewMedModal = () => {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className={styles.medFormContainer}>
            <button
                className={styles.dashboard_button}
                onClick={() => setShowModal(true)}>
                New Medication
            </button>
            {showModal && (
                <Modal onClose={() => setShowModal(false)}>
                    <MedsListForm setShowModal={setShowModal}/>
                </Modal>
            )
        }
    </div>
    )
}
