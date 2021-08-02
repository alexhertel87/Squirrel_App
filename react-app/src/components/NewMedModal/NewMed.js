import React, { useState } from 'react';
import { Modal } from '../../context/Modal';
import MedsListForm from '../MedsList/MedsListForm';
import styles from './NewMedForm.module.css'


export const NewMedModal = () => {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <button
                className={styles.newMedButton}
                onClick={() => setShowModal(true)}>
                New Medication
            </button>
            {showModal && (
                <Modal onClose={() => setShowModal(false)}>
                    <MedsListForm setShowModal={setShowModal}/>
                </Modal>
            )
        }
    </>
    )
}
