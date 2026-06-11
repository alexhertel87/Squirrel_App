
import React from 'react';
import { useSelector } from 'react-redux';
import { NavLink, Link } from 'react-router-dom';
import LogoutButton from './LogoutButton/LogoutButton';
import './Navbar.css'
// import SignupFormModal from "./SignupFormModal";
// import SignUpForm from './SignupFormModal/SignUpForm';
import logo from '../../assets/squirrel_logo.png';
import styles from './Navbar.module.css';


const NavBar = () => {
  const user = useSelector((state) => state.session.user);

  // let userRender = (
  //   <>
  //     <LoginFormModal className="nav-button" />
  //     <SignupFormModal className="nav-button" />
  //   </>
  // )

  return (
    <nav className={styles.navContainer}>
      <div className={styles.nav_leftside}>
        <div className="nav-logo">
          <div className={styles.logoDiv}>Squirrel!
              <Link to={user ? '/dashboard' : '/login'}>
                <img className="logo-pic" src={logo} alt="squirrel_logo"></img>
              </Link>
            </div>
        </div>
      </div>
      <div className={styles.nav_right}>
        <ul className={styles.linkDiv}>
          {user && (
            <>
              <li>
                <NavLink to='/dashboard' exact={true} activeClassName='active'>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to='/dashboard/calendar' exact={true} activeClassName='active'>
                  Calendar
                </NavLink>
              </li>
            </>
          )}
          {!user && (
            <li>
              <NavLink to='/sign-up' exact={true} activeClassName='active'>
                Sign Up
              </NavLink>
            </li>
          )}
          {/* <li>
            <NavLink to='/users' exact={true} activeClassName='active'>
              Users
            </NavLink>
          </li> */}
          <li>
            <LogoutButton />
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default NavBar;
