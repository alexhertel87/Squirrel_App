//*----------------- Action Creators ---------------//

const NEW_ACTIVE_MED = '/medications/active/new'
const GET_ACTIVE_MEDS = '/medications/active/all'
const UPDATE_ACTIVE_MED = '/medications/active/update'
const DELETE_ACTIVE_MED = '/medications/active/delete'

const new_med = (med) => ({
    type: 'NEW_ACTIVE_MED',
    payload: med
})

const all_meds = (meds) => ({
    type: 'GET_ACTIVE_MEDS',
    payload: meds
})

const update_med = (med) => ({
    type: 'UPDATE_ACTIVE_MED',
    payload: med
})

const delete_med = (med) => ({
    type: 'DELETE_ACTIVE_MED',
    payload: med
})

//**********************************************************
//? -*-*-*-*-*-*-*-*-*-*- Thunks -*-*-*-*-*-*-*-*-*-*-//
//* **********************************************************/

// ------------ CREATE New Med Thunk ------------//

export const add_new_med = (med) => async (dispatch) => {

    const res = await fetch('/api/meds_list/new', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(med),
    })
    console.log(res);
    if (res.ok) {
        const meds = await res.json()
        console.log("MEDSSSSSSS",meds);
        dispatch(new_med(meds))
        return meds
    }
}

// ------------ GET Active Meds Thunk ------------//

export const all_active_meds = (user_id) => async (dispatch) => {
    const res = await fetch(`/api/meds_list/${user_id}/all`)
    if (res.ok) {
        const all_active = await res.json()
        dispatch(all_meds(all_active.active_meds))
        return 'SUCCESS'
    }
}

// ------------ UPDATE Active Meds Thunk ------------//

export const update_active_med = (med) => async (dispatch) => {
    const res = await fetch(`/api/meds_list/${med.id}/update`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(med),
    })
    if (res.ok) {
        const oneMed = await res.json()
        dispatch(update_med(oneMed))
        return oneMed
    }
}

// ------------ DELETE Active Meds Thunk ------------//

export const delete_active_med = (med_id) => async (dispatch) => {
    const res = await fetch(`/api/meds_list/${med_id}/delete`, {
        method: 'DELETE',
    })
        dispatch(delete_med(med_id))
        return 'DELETED'
}

// -------------------------------------------//
const initialState = {}
// -------------------------------------------//

//* ------------ Meds List Reducer ------------//

const active_meds_reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'NEW_ACTIVE_MED':{
            const new_state = {
                ...state,
                [action.payload.id]: action.payload,
            }
            return new_state;
        }
        case 'GET_ACTIVE_MEDS':{
            const new_state = {
            }
            action.payload.forEach((med) => {
                new_state[med.id] = med
            })
            return new_state;
        }
        case 'UPDATE_ACTIVE_MED':{
            const new_state = {
                ...state,
                [action.payload.id]: action.payload,
            }
            return new_state;
        }
        case 'DELETE_ACTIVE_MED':{
            const new_state = {
                ...state
            }
            delete new_state[action.payload]
            return new_state;
        }
        default:
            return state;
    }
}

export default active_meds_reducer
