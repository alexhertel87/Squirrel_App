import React, { useState } from 'react';
import { Modal } from '../../context/Modal';
import TaskListForm from './TaskListForm';
import styles from './TaskList.module.css'
// import classes from '../../Dashboard/Dashboard.module.css'


export const TaskListModal = () => {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className={styles.taskFormContainer}>
            <button
                className={styles.dash_task_button}
                onClick={() => setShowModal(true)}>
                Add A New Task
            </button>
            {showModal && (
                <Modal onClose={() => setShowModal(false)}>
                    <TaskListForm setShowModal={setShowModal}/>
                </Modal>
            )
        }
    </div>
    )
}
export default TaskListModal;
