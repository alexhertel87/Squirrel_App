import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { login } from '../../../store/session';
import Button from '../../Button';
import styles from '../ModalForms.module.css';

const LoginForm = () => {
  const [errors, setErrors] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const user = useSelector(state => state.session.user);
  const dispatch = useDispatch();

  const onLogin = async (e) => {
    e.preventDefault();
    const data = await dispatch(login(email, password));
    if (data) {
      setErrors(data);
    }
    
  };

  const demoLogin = async (e) => {
    e.preventDefault();
    const data = await dispatch(login("demo@aa.io", "password"));
    if (data) {
      setErrors(data);
    }
  };

  const updateEmail = (e) => {
    setEmail(e.target.value);
  };

  const updatePassword = (e) => {
    setPassword(e.target.value);
  };

  if (user) {
    return <Redirect to='/' />;
  }

  return (
    <div className={styles.formContainer}>
      <form className={ styles.form } onSubmit={onLogin}>
        <div className={styles.inputRow}>
          {errors.map((error, ind) => (
            <div key={ind}>{error}</div>
          ))}
        </div>
        <div>
          <label htmlFor='email' className={ styles.placeholder}>Email</label>
          <input
            className={styles.inputField}
            name='email'
            type='text'
            placeholder='Email'
            value={email}
            onChange={updateEmail}
          />
        </div>
        <div className={styles.inputRow}>
          <label htmlFor='password' className={ styles.placeholder}>Password</label>
          <input
            className={styles.inputField}
            name='password'
            type='password'
            placeholder='Password'
            value={password}
            onChange={updatePassword}
          />
          <div className={styles.buttonContainer}>
            <div>
              <button type='submit'>
                <Button
                  text={"Log In"}
                  action={onLogin}
                  color={"electricblue"}
                  width={100} />
              </button>
            </div>
            <div>
              <button type='submit'>
                <Button
                  text={"Demo User Login"}
                  action={demoLogin}
                  // color={"limegreen"}
                  width={180} />
              </button>
            </div>
            </div>
          {/* <button type='submit'>Login</button> */}
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
