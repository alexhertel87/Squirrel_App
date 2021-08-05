import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { add_new_med } from '../../store/meds_list';
import * as sessionActions from '../../store/session';
import * as userActions from '../../store/task_list';
import styles from './TaskList.module.css';

export const TaskListForm = ({ setShowModal }) => {
    const dispatch = useDispatch();
    const params = useParams();
    const user = useSelector(state => state.session.user);

    const [errors, setErrors] = useState([]);
    const [taskName, setTaskName] = useState('');
    const [dueDate1, setDueDate1] = useState('');
    const [dueDate2, setDueDate2] = useState('');
    const [completed, setCompleted] = useState(false);
    const [completedAt, setCompletedAt] = useState('');

    const user_id = user?.id;

    const onSubmit = async (e) => {
        e.preventDefault();
        if (user_id) {
            setErrors([]);
            const task = {
                task_name: taskName,
                due_date_1: dueDate1,
                due_date_2: dueDate2,
                completed: completed,
                completed_at: completedAt
            };
            dispatch(userActions.new_task_item(task));
            setShowModal(false);
        }
        else {
            setErrors(['Please login to add a task']);
        }
    }
    useEffect(() => {
        setErrors([]);
    }, [dispatch, user_id]);

    return (
        <div className={ styles.task_form_container}>
            <h1>Add a New Task to Your To-Do List</h1>
            <form onSubmit={onSubmit} className={styles.task_form}>
                <div className={styles.task_form_row}>
                    <label htmlFor="task_name">Task Name</label>
                    <div className={styles.task_form_input}>
                        <input
                            type="text"
                            id="task_name"
                            name="task_name"
                            value={taskName}
                            onChange={(e) => setTaskName(e.target.value)}
                            placeholder="What do you need to get done?"
                        ></input>
                    </div>
                </div>
                <div className={styles.task_form_row}>
                    <label htmlFor="due_date_1">Due Date</label>
                    <div className={styles.task_form_input}>
                        <input
                            type="date"
                            id="due_date_1"
                            name="due_date_1"
                            value={dueDate1}
                            onChange={(e) => setDueDate1(e.target.value)}
                            placeholder="Target Due Date"
                        ></input>
                    </div>
                </div>
                <div className={styles.task_form_row}>
                    <label htmlFor="due_date_2">Due Date</label>
                    <div className={styles.task_form_input}>
                        <input
                            type="date"
                            id="due_date_2"
                            name="due_date_2"
                            value={dueDate2}
                            onChange={(e) => setDueDate2(e.target.value)}
                            placeholder="(...If you procrastinated...)"
                        ></input>
                    </div>
                </div>
                <div className={styles.task_form_row}>
                    <label htmlFor="completed">Completed</label>
                    <div className={styles.task_form_input}>
                        <input
                            type="checkbox"
                            id="completed"
                            name="completed"
                            value={completed}
                            onChange={(e) => setCompleted(e.target.checked)}
                        ></input>
                    </div>
                </div>
                <div className={styles.task_form_row}>
                    <label htmlFor="completed_at">Completed At</label>
                    <div className={styles.task_form_input}>
                        <input
                            type="date"
                            id="completed_at"
                            name="completed_at"
                            value={completedAt}
                            onChange={(e) => setCompletedAt(e.target.value)}
                            placeholder="Lets get this done!"
                        ></input>
                    </div>
                </div>
                <div className={styles.task_form_row}>
                    <button type="submit" className={styles.task_form_button}>
                        Add Task
                    </button>
                </div>
            </form>
        </div>
    )
}

export default TaskListForm;
