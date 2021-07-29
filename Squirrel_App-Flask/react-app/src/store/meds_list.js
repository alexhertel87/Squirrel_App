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


