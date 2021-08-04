import React, { useState } from 'react';
import { Modal } from '../../context/Modal';
//change this when css module is done
import styles from './CurrentMeds.module.css';
import NewMedModal from '../NewMedModal/NewMed';
import { MedsListData } from './MedsListData';

export const CurrMedsModal = () => {
    const [showModal, setShowModal] = useState(false);

    return (
        <div>
            <div className={styles.medFormContainer}>
                <button
                    className={styles.dashboard_button}
                    onClick={() => setShowModal(true)}>
                    View My Current Medications
                </button>
                {showModal && (
                    <Modal onClose={() => setShowModal(false)}>
                        <MedsListData setShowModal={setShowModal}/>
                    </Modal>
                )
            }
            </div>
        </div>
    )
}
