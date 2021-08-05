//*----------------- Action Creators ---------------//
const NEW_TASK_ITEM = '/tasks/new'
const GET_ALL_TASKS = '/tasks/all'
const UPDATE_ONE_TASK = '/tasks/update'
const DELETE_ONE_TASK = '/tasks/delete'

const new_task = (task) => ({
    type: 'NEW_TASK_ITEM',
    payload: task
})
const get_all_tasks = () => ({
    type: 'GET_ALL_TASKS',
    payload: tasks
})
const update_task = (task) => ({
    type: 'UPDATE_ONE_TASK',
    payload: task
})
const delete_task = (task) => ({
    type: 'DELETE_ONE_TASK',
    payload: task
})


//*       **************************************
//? -*-*-*-*-*-*-*-*-*-*- Thunks -*-*-*-*-*-*-*-*-*-*-//
//*       **************************************


// ------------ CREATE New Task Item Thunk ------------//

export const new_task_item = (task) => async (dispatch) => {
    const res = await fetch(`/tasks/new`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(task)
    })
    if (res.ok) {
        const tasks = await res.json()
        dispatch(new_task(tasks))
        return tasks
    }
}

// ------------ GET All Tasks Thunk ------------//

export const all_task_items = () => async (dispatch) => {
    const res = await fetch(`/tasks/all`)
    if (res.ok) {
        const all_tasks = await res.json()
        dispatch(get_all_tasks(all_tasks))
        return 'SUCCESS'
    }
}

// ------------ UPDATE Task Item Thunk ------------//

export const update_task_item = (task) => async (dispatch) => {
    const res = await fetch(`/tasks/update`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(task)
    })
    if (res.ok) {
        const tasks = await res.json()
        dispatch(update_task(tasks))
        return tasks
    }
}

// ------------ DELETE Task Item Thunk ------------//

export const delete_task_item = (task) => async (dispatch) => {
    const res = await fetch(`/tasks/delete`, {
        method: 'DELETE',
    })
    dispatch(delete_task(task))
}
// -------------------------------------------//
const initialState = {tasks: []}
// -------------------------------------------//

//* ------------ Task List Reducer ------------//

const task_list_reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'NEW_TASK_ITEM': {
            const new_state = Object.assign({}, state)
            new_state[action.payload.id] = action.payload

            return new_state;
        }
        case 'GET_ALL_TASKS': {
            const new_state = {
                ...action.payload
            }
            return new_state;
        }
        case 'UPDATE_ONE_TASK': {
            const new_state = {
                ...state,
                [action.payload.id]: action.payload
            }
            return new_state;
        }
        case 'DELETE_ONE_TASK': {
            const new_state = {
                ...state
            }
            delete new_state[action.payload.id]
            return new_state;
        }
        default:
            return state
    }
}
export default task_list_reducer
