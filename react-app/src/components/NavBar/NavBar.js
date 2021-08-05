
import React from 'react';
import { NavLink, Link, Redirect, useHistory } from 'react-router-dom';
import LogoutButton from './LogoutButton/LogoutButton';
import './Navbar.css'
import LoginFormModal from "./LoginFormModal";
// import SignupFormModal from "./SignupFormModal";
// import SignUpForm from './SignupFormModal/SignUpForm';
import logo from '../../assets/squirrel_logo.png';
import Button from "../Button";
import styles from './Navbar.module.css';


const NavBar = () => {

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
              <Link to="/dashboard">
                <img className="logo-pic" src={logo} alt="squirrel_logo"></img>
              </Link>
            </div>
        </div>
      </div>
      <div className={styles.nav_right}>
        <ul className={styles.linkDiv}>
          <li>
            <NavLink to='/dashboard' exact={true} activeClassName='active'>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to='/login' exact={true} activeClassName='active'>
              Login
            </NavLink>
          </li>
          <li>
            <NavLink to='/sign-up' exact={true} activeClassName='active'>
              Sign Up
            </NavLink>
          </li>
          <li>
            <NavLink to='/users' exact={true} activeClassName='active'>
              Users
            </NavLink>
          </li>
          <li>
            <LogoutButton />
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default NavBar;
