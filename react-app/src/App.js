import React, { useState, useEffect } from 'react';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import LoginForm from './components/NavBar/LoginFormModal/LoginForm.js';
import NavBar from './components/NavBar/NavBar';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { authenticate } from './store/session';
import SignUpForm from './components/NavBar/SignupFormModal/SignUpForm';
import MedsListForm from './components/MedsList/MedsListForm';
import Dashboard from './components/Dashboard/Dashboard';
import Calendar from './components/Calendar/Calendar';
import LearningHub from './components/LearningHub/LearningHub';
// import * as MedsListActions from './store/meds_list'
import MedsListData from './components/CurrentMedsModal/MedsListData.js';
import Footer from './components/Footer/index.js';
import TaskListForm from './components/TaskList/TaskListForm.js';
import TaskListData from './components/TaskList/TaskListData.js';



function App() {
  const [loaded, setLoaded] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.session.user);

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
        <Route path='/' exact={true}>
          <Redirect to={user ? '/dashboard' : '/login'} />
        </Route>
        <Route path='/login' exact={true}>
          {user ? <Redirect to='/dashboard' /> : <LoginForm />}
        </Route>
        <ProtectedRoute path='/dashboard/meds/new' exact={true}>
          <MedsListForm />
        </ProtectedRoute>
        <ProtectedRoute path='/dashboard/tasks/new' exact={true}>
          <TaskListForm />
        </ProtectedRoute>
        <ProtectedRoute path='/dashboard' exact={true}>
          <Dashboard />
        </ProtectedRoute>
        <ProtectedRoute path='/dashboard/current_meds' exact={true}>
          <MedsListData />
        </ProtectedRoute>
        <ProtectedRoute path='/dashboard/task_list' exact={true}>
          <TaskListData />
        </ProtectedRoute>
        <ProtectedRoute path='/dashboard/calendar' exact={true}>
          <Calendar />
        </ProtectedRoute>
        <ProtectedRoute path='/dashboard/school' exact={true}>
          <LearningHub />
        </ProtectedRoute>
        <ProtectedRoute path='/dashboard/learning' exact={true}>
          <Redirect to='/dashboard/school' />
        </ProtectedRoute>
        <Route path='/sign-up' exact={true}>
          {user ? <Redirect to='/dashboard' /> : <SignUpForm />}
        </Route>
      </Switch>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
