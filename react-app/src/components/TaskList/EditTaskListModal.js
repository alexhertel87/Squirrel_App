import React, { useState } from 'react';
import { Modal } from '../../context/Modal';
import EditTaskForm from './EditTaskListForm';
import styles from './TaskList.module.css'


export const EditTaskModal = ({task}) => {
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
                    <EditTaskForm task={task} setShowModal={setShowModal} />
                </Modal>
            )
        }
    </div>
    )
}
export default EditTaskModal;
