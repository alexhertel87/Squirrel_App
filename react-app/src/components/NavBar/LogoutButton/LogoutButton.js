import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../store/session';
import { useHistory } from 'react-router-dom';
import styles from '../Navbar.module.css'

const LogoutButton = () => {
  const dispatch = useDispatch()
  const history = useHistory();
  const user = useSelector((state) => state.session.user);

  const onAuthClick = async () => {
    if (user) {
      await dispatch(logout());
    }
    history.push('/login');
  };

  return <button
    onClick={onAuthClick}
    className={styles.logoutButton}
    type="button"
  >{user ? 'Log Out' : 'Log In'}</button>;
};

export default LogoutButton;
