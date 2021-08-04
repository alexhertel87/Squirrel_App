//*----------------- Action Creators ---------------//

const NEW_LOGGED_MED = '/medications/logged/new'
const GET_LOGGED_MEDS = '/medications/logged/get_all'

const newly_logged = (med) => ({
    type: NEW_LOGGED_MED,
    payload: med
})

const logged_meds = (meds) => ({
    type: GET_LOGGED_MEDS,
    payload: meds
})


//**********************************************************
//? -*-*-*-*-*-*-*-*-*-*- Thunks -*-*-*-*-*-*-*-*-*-*-//
//* **********************************************************/

// ------------- CREATE Newly Logged Med Thunk ------------- //

export const add_to_log = (med) => (dispatch) => {
    const res = await fetch(`/api/medications/logged/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(med)
    })
    if (res.ok) {
        dispatch(newly_logged(med))
    }
}

// ------------- GET All Logged Meds Thunk ------------- //

export const view_logged_meds = (user_id) => (dispatch) => {
    const res = await fetch(`/api/medications/logged/${user_id}/get_all`)
    if (res.ok) {
        const logged_meds = await res.json()
        dispatch(logged_meds(logged_meds))
        return 'SUCCESS'
    }
}

// -------------------------------------------//

// ------------ Meds Log Reducer ------------//
