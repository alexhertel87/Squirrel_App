import React, { useState } from 'react';
import { Modal } from '../../context/Modal';
import EditTaskForm from './EditTaskListForm';
import styles from './TaskList.module.css'


export const EditTaskModal = ({med}) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className={styles.taskFormContainer}>
            <button
                className={styles.edit_task_btn}
                onClick={() => setShowModal(true)}>
                Edit Task
            </button>
            {showModal && (
                <Modal onClose={() => setShowModal(false)}>
                    <EditTaskForm med={med} setShowModal={setShowModal} />
                </Modal>
            )
        }
    </div>
    )
}
export default EditTaskModal;
