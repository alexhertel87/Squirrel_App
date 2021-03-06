import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import LoginForm from './components/NavBar/LoginFormModal/LoginForm.js';
import NavBar from './components/NavBar/NavBar';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UsersList from './components/UsersList';
import User from './components/User';
import { authenticate } from './store/session';
import SignUpForm from './components/NavBar/SignupFormModal/SignUpForm';
import MedsListForm from './components/MedsList/MedsListForm';
import Dashboard from './components/Dashboard/Dashboard';
// import * as MedsListActions from './store/meds_list'
import MedsListData from './components/CurrentMedsModal/MedsListData.js';
import Footer from './components/Footer/index.js';
import TaskListForm from './components/TaskList/TaskListForm.js';
import TaskListData from './components/TaskList/TaskListData.js';



function App() {
  const [loaded, setLoaded] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    (async() => {
      await dispatch(authenticate());

      setLoaded(true);
    })();
  }, [dispatch]);

  if (!loaded) {
    return null;
  }

  return (
    <BrowserRouter>
      <NavBar />
      <Switch>
        <Route path='/login' exact={true}>
          <LoginForm />
        </Route>
        <Route path='/dashboard/meds/new' exact={true}>
          <MedsListForm />
        </Route>
        <Route path='/dashboard/tasks/new' exact={true}>
          <TaskListForm />
        </Route>
        <Route path='/dashboard' exact={true}>
          <Dashboard />
        </Route>
        <Route path='/dashboard/current_meds' exact={true}>
          <MedsListData />
        </Route>
        <Route path='/dashboard/task_list' exact={true}>
          <TaskListData />
        </Route>
        <Route path='/sign-up' exact={true}>
          <SignUpForm />
        </Route>
        {/* <ProtectedRoute path='/users' exact={true} >
          <UsersList/>
        </ProtectedRoute>
        <ProtectedRoute path='/users/:userId' exact={true} >
          <User />
        </ProtectedRoute>
        <ProtectedRoute path='/' exact={true} >
          <h1 >Squirrel!</h1>
        </ProtectedRoute> */}
      </Switch>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
