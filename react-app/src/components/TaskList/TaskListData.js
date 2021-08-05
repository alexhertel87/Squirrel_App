import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
// import { new_task_item } from '../../store/tasks_list';
import * as sessionActions from '../../store/session';
import * as userActions from '../../store/tasks_list';
import * as TaskListActions from '../../store/task_list';
import EditTaskModal from './EditTaskListModal';
import styles from './TaskList.module.css';


export const TaskListData = () => {

    const tasks = useSelector((state) => state.task_items);

    const taskArray = Object.values(tasks);

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(TaskListActions.all_task_items());
    }, [dispatch]);


    return (
        <div>
            <h1 className={styles.tasks_header}>My To-Do List</h1>
            <h2 className={styles.tasks_header}>(C'mon...it'll only take 10 minutes)</h2>
            <div className={styles.TableDiv}>
            <table>
                <thead className={styles.TableHeader}>
                    <tr className={styles.ColumnNames}>
                        <th className={styles.ColumnNames}>Task Name</th>
                        <th className={styles.ColumnNames}>Goal Due Date</th>
                        <th className={styles.ColumnNames}>LATEST Due By</th>
                            <th className={styles.ColumnNames}>Completed (Y || N)</th>
                            <th className={styles.ColumnNames}>Completed At</th>
                    </tr>
                </thead>
                <tbody className={styles.TableBody}>
                    {taskArray && taskArray.map(task => (
                        <tr className={styles.task_items}>
                            <td className={styles.tasks_data}>{task.task_name}</td>
                            <td className={styles.tasks_data}>{task.due_date_1}</td>
                            <td className={styles.tasks_data}>{task.due_date_2}</td>
                            <td className={styles.tasks_data}>{task.completed}</td>
                            <td className={styles.tasks_data}>{task.completed_at}</td>
                            <EditTaskModal task={task} />
                            <button onClick={() => dispatch(userActions.delete_task_item(task.id))}
                                className={styles.task_btn}>Delete</button>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </div >
        // </div>
    )
}

export default TaskListData;
