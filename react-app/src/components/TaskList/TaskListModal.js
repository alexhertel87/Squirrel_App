import React, { useState } from 'react';
import { Modal } from '../../context/Modal';
import TaskListForm from './TaskListForm';
import styles from './TaskList.module.css'
// import classes from '../../Dashboard/Dashboard.module.css'


export const TaskListModal = ({
    buttonLabel = 'Add a New Task',
    makeCurrentDefault = false,
    onTaskCreated,
} = {}) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className={styles.taskFormContainer}>
            <button
                className={styles.dash_task_button}
                onClick={() => setShowModal(true)}>
                {buttonLabel}
            </button>
            {showModal && (
                <Modal onClose={() => setShowModal(false)}>
                    <TaskListForm
                        makeCurrentDefault={makeCurrentDefault}
                        onTaskCreated={onTaskCreated}
                        setShowModal={setShowModal}
                    />
                </Modal>
            )
        }
    </div>
    )
}
export default TaskListModal;
