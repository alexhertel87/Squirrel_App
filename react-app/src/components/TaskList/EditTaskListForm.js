import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import * as sessionActions from '../../store/session';
import * as userActions from '../../store/task_list';
import styles from './TaskList.module.css';

export const EditTaskForm = ({ setShowModal, task }) => {
    console.log(task);
    const dispatch = useDispatch();
    const params = useParams();
    const user = useSelector(state => state.session.user);

    // const temp1 = new Date(task.due_date_1)
    // let tempDate1 = temp1.getUTCFullYear() + "-"
    // tempDate1 += (Number(temp1.getUTCMonth()) + 1) < 10 ? "0" + (Number(temp1.getUTCMonth()) + 1) : (Number(temp1.getUTCMonth()) + 1)
    // tempDate1 += "-" + (temp1.getUTCDate())

    // const temp2 = new Date(task.due_date_2)
    // let tempDate2 = temp2.getUTCFullYear() + "-"
    // tempDate2 += (Number(temp2.getUTCMonth()) + 1) < 10 ? "0" + (Number(temp2.getUTCMonth()) + 1) : (Number(temp2.getUTCMonth()) + 1)
    // tempDate2 += "-" + (temp2.getUTCDate())



    const [errors, setErrors] = useState([]);
    const [taskName, setTaskName] = useState(task.task_name);
    const [dueDate1, setDueDate1] = useState(task.dueDate1);
    const [dueDate2, setDueDate2] = useState(task.dueDate2);
    const [completed, setCompleted] = useState(false);
    const [completedAt, setCompletedAt] = useState("");

    console.log(dueDate1);

    const user_id = user?.id;
    const task_id = task?.id;
    console.log("TASK ID --->", task_id);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (user_id) {
            setErrors([]);
            const task = {
                id: task_id,
                task_name: taskName,
                due_date_1: dueDate1,
                due_date_2: dueDate2,
                completed: completed,
                completed_at: completedAt
            };
            console.log(task);
            dispatch(userActions.update_task_item(task));
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
        <h1>Edit Task</h1>
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
                    Submit Edit
                </button>
            </div>
        </form>
    </div>
)
}

export default EditTaskForm;
