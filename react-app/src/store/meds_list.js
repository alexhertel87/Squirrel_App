//*----------------- Action Creators ---------------//

const NEW_ACTIVE_MED = '/medications/active/new'
const GET_ACTIVE_MEDS = '/medications/active/all'
const UPDATE_ACTIVE_MED = '/medications/active/update'
const DELETE_ACTIVE_MED = '/medications/active/delete'

const new_med = (med) => ({
    type: 'NEW_ACTIVE_MED',
    payload: med
})

const all_meds = () => ({
    type: 'GET_ACTIVE_MEDS',
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

// ------------ New Med Thunk ------------//

export const add_new_med = (med) => async (dispatch) => {
    const res = await fetch('/api/active_list/new', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(med),
    })
    if (res.ok) {
        const meds = await res.json()
        dispatch(new_med(meds))
        return meds
    }
}

// ------------ Get Active Meds Thunk ------------//

export const all_active_meds = (user_id) => async (dispatch) => {
    const res = await fetch(`/api/active_list/${user_id}/all`)
    if (res.ok) {
        const all_active = await res.json()
        dispatch(all_meds(all_active.active_meds))
        return 'SUCCESS'
    }
}

// ------------ Update Active Meds Thunk ------------//

export const update_active_med = (med_id) => async (dispatch) => {
    const res = await fetch(`/api/active_list/${med_id}/update`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(med_id),
    })
    if (res.ok) {
        const med = await res.json()
        dispatch(update_med(med))
        return med
    }
}

// ------------ Delete Active Meds Thunk ------------//

export const delete_active_med = (med_id) => async (dispatch) => {
    const res = await fetch(`/api/active_list/${med_id}/delete`, {
        method: 'DELETE',
    })
        dispatch(delete_med(med_id))
        return 'DELETED'
}
