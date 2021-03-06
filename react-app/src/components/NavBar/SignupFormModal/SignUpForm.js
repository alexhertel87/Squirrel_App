import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { Redirect, useHistory } from 'react-router-dom';
import { signUp } from '../../../store/session';
import styles from '../ModalForms.module.css';
import LoginForm from "../LoginFormModal/LoginForm";
import Button from "../../Button";

const SignUpForm = () => {
  const [errors, setErrors] = useState([]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const user = useSelector(state => state.session.user);
  const [existingUser, setExistingUser] = useState(false);
  const dispatch = useDispatch();
  const history = useHistory();

  const onSignUp = async (e) => {
    e.preventDefault();
    if (password === repeatPassword) {
      const data = await dispatch(signUp(username, email, password));
      if (data) {
        setErrors(data)
      }
      history.push('/dashboard');
    }
  };

  const goLogIn = () => {
    return setExistingUser(true);
  };

  const updateUsername = (e) => {
    setUsername(e.target.value);
  };

  const updateEmail = (e) => {
    setEmail(e.target.value);
  };

  const updatePassword = (e) => {
    setPassword(e.target.value);
  };

  const updateRepeatPassword = (e) => {
    setRepeatPassword(e.target.value);
  };

  if (user) {
    return <Redirect to='/' />;
  }

  return (
    <>
      {!existingUser && (
        <div className={styles.formContainer}>
          <form className={styles.form} onSubmit={onSignUp}>
            <div className={styles.inputRow}>
              {/* <label>User Name</label> */}
              <input
                className={styles.inputField}
                type="text"
                name="username"
                placeholder="Username"
                onChange={updateUsername}
                value={username}
                required={true}
              ></input>
            </div>
            <div className={styles.inputRow}>
              {/* <label>Email</label> */}
              <input
                className={styles.inputField}
                type="text"
                name="email"
                placeholder="Email"
                onChange={updateEmail}
                value={email}
                required={true}
              ></input>
            </div>
            <div className={styles.inputRow}>
              {/* <label>Password</label> */}
              <input
                className={styles.inputField}
                type="password"
                name="password"
                placeholder="Password"
                onChange={updatePassword}
                value={password}
                required={true}
              ></input>
            </div>
            <div className={styles.inputRow}>
              {/* <label>Repeat Password</label> */}
              <input
                className={styles.inputField}
                type="password"
                name="repeat_password"
                placeholder="Confirm Password"
                onChange={updateRepeatPassword}
                value={repeatPassword}
                required={true}
              ></input>
            </div>
            {/* <button type="submit">Sign Up</button> */}
            <button type="submit">
              <Button
                text={"Submit"}
                action={onSignUp}
                color={"pink"}
                width={200}
              />
            </button>
            <Button
              text={"Already a User"}
              action={goLogIn}
              color={"pink"}
              width={200}
            />
            <div className={styles.errorsContainer}>
              {errors.map((error, ind) => (
                <div className={styles.error} key={ind}>
                  {error}
                </div>
              ))}
            </div>
          </form>
        </div>
      )}
      {existingUser && <LoginForm />}
    </>
  );
};

export default SignUpForm;
