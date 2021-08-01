
import React from 'react';
import { NavLink, Link, Redirect, useHistory } from 'react-router-dom';
import LogoutButton from './LogoutButton/LogoutButton';
import './Navbar.css'
import LoginFormModal from "./LoginFormModal";
// import SignupFormModal from "./SignupFormModal";
// import SignUpForm from './SignupFormModal/SignUpForm';
import logo from '../../assets/squirrel_logo.png';
import Button from "../Button";

const NavBar = () => {

  // let userRender = (
  //   <>
  //     <LoginFormModal className="nav-button" />
  //     <SignupFormModal className="nav-button" />
  //   </>
  // )

  return (
    <nav className="nav-container">
      <div className="nav-logo">
          <Link to="/">
            <img className="logo-pic" src={logo} alt="squirrel_logo"></img>
          </Link>
        </div>
      {/* <div className="nav-rightside">
        {userRender}
      </div> */}
      <ul>
        <li>
          <NavLink to='/' exact={true} activeClassName='active'>
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
    </nav>
  );
}

export default NavBar;
