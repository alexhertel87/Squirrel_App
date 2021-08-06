import React from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../../../store/session';
import { Redirect, useHistory } from 'react-router-dom';
import styles from '../Navbar.module.css'

const LogoutButton = () => {
  const dispatch = useDispatch()
  const history = useHistory();

  const onLogout = async (e) => {
    await dispatch(logout());
    history.push('/login');
  };

  return <button
    onClick={onLogout}
    className={styles.logoutButton}
  >Logout</button>;
};

export default LogoutButton;
