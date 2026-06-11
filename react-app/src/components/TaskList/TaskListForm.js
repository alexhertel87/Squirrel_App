import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import * as userActions from '../../store/task_list';
import {
    getLocalSupportState,
    normalizeSupportState,
    persistSupportState,
} from '../../utils/neuroSupport';
import styles from './TaskList.module.css';

export const TaskListForm = ({
    makeCurrentDefault = false,
    onTaskCreated,
    setShowModal,
}) => {
    const dispatch = useDispatch();
    const user = useSelector(state => state.session.user);

    const [errors, setErrors] = useState([]);
    const [taskName, setTaskName] = useState('');
    const [dueDate1, setDueDate1] = useState('');
    const [dueDate2, setDueDate2] = useState('');
    const [makeCurrentTask, setMakeCurrentTask] = useState(makeCurrentDefault);
    // const [completed, setCompleted] = useState(false);
    // const [completedAt, setCompletedAt] = useState('');
    const history = useHistory();

    const user_id = user?.id;

    const onSubmit = async (e) => {
        e.preventDefault();
        if (user_id) {
            setErrors([]);
            const task = {
                task_name: taskName,
                due_date_1: dueDate1,
                due_date_2: dueDate2
            };
            const createdTask = await dispatch(userActions.new_task_item(task));
            if (createdTask?.id && makeCurrentTask) {
                const currentSupport = getLocalSupportState();
                const nextSupport = normalizeSupportState({
                    ...currentSupport,
                    currentTaskId: createdTask.id,
                    routines: {
                        ...currentSupport.routines,
                        'reset:Pick next task': true,
                    },
                });
                persistSupportState(nextSupport);
                if (onTaskCreated) onTaskCreated(createdTask, nextSupport);
            } else if (onTaskCreated) {
                onTaskCreated(createdTask);
            }
            setShowModal(false);
            history.push('/dashboard/task_list');
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
            <h1 className={styles.h1}>Add a New Task to Your To-Do List</h1>
            <h2 className={styles.h2}>(The Anti-Procrastination Station)</h2>
            {!!errors.length && (
                <ul className={styles.formErrors}>
                    {errors.map((error) => (
                        <li key={error}>{error}</li>
                    ))}
                </ul>
            )}
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
                            placeholder="What do you need to do"
                        ></input>
                    </div>
                </div>
                <div className={styles.task_form_row}>
                    <label htmlFor="due_date_1">Optimal Due Date</label>
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
                    <label htmlFor="due_date_2">*Absolute Latest* Due Date</label>
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
                {/* <div className={styles.task_form_row}>
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
                </div> */}
                <div className={styles.task_form_row}>
                    <label className={styles.checkboxRow}>
                        <input
                            checked={makeCurrentTask}
                            onChange={(e) => setMakeCurrentTask(e.target.checked)}
                            type="checkbox"
                        />
                        Make this my current task
                    </label>
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
