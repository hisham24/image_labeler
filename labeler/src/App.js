import React, { useEffect } from 'react';
import { loginSession, setAlert } from './reducers/sessionReducer';
import { logout } from './store';
import Labeler from './components/Labeler';
import ImageFolders from './components/ImageFolders';
import Login from './components/Login';
import SignUp from './components/SignUp';
import RegistrationSuccess from './components/RegistrationSuccess';
import Alert from '@material-ui/lab/Alert';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import { useDispatch, useSelector } from 'react-redux';
import {
  Switch,
  Route,
  Redirect
} from 'react-router-dom';

import { makeStyles } from '@material-ui/core/styles';
const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main
  },
  form: {
    width: '100%',
    marginTop: theme.spacing(1)
  },
  submit: {
    margin: theme.spacing(3, 0, 2)
  }
}));

const parseJWTExpirationDate = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

// FIX
const attemptLogin = () => {
  const loggedUser = JSON.parse(localStorage.getItem('loggedUser'));
  if (loggedUser) {
    const decodedJwt = parseJWTExpirationDate(loggedUser.token);
    if (decodedJwt === null) {
      return false;
    }
    if (decodedJwt.exp * 1000 > Date.now()) { return true; } else { return false; }
  } else { return false; }
};

const App = () => {
  const dispatch = useDispatch();
  const classes = useStyles();
  const [username, signUpStatus, alertStatus, alertMessage] = useSelector(state => [
    state.sessionTool.username,
    state.sessionTool.signUpStatus,
    state.sessionTool.alertStatus,
    state.sessionTool.alertMessage
  ]);

  useEffect(() => {
    dispatch(setAlert(false));
    if (attemptLogin()) {
      const loggedUser = JSON.parse(localStorage.getItem('loggedUser'));
      dispatch(loginSession(loggedUser.username, loggedUser.token));
    }
  }, []);

  const handleSignUpPage = () => {
    if (username !== null) { return <Redirect to="/" />; } else if (signUpStatus) {
      return <RegistrationSuccess />;
    } else { return <SignUp />; }
  };

  const handleLogoutClick = () => {
    dispatch(logout());
  };

  return (
        <div>
            <AppBar position="static">
                <Toolbar>
                    {username !== null && <Button color="inherit" onClick={handleLogoutClick}>Logout</Button>}
                </Toolbar>
            </AppBar>
            {alertStatus &&
                <div className={classes.paper}>
                    <Alert severity="error">{alertMessage}</Alert>
                </div>
            }
            <Switch>
                <Route path="/label">
                    {(username !== null) ? <Labeler /> : <Redirect to="/login" />}
                </Route>
                <Route path="/login">
                    {(username !== null) ? <Redirect to="/" /> : <Login />}
                </Route>
                <Route path="/signup">
                    {handleSignUpPage()}
                </Route>
                <Route path="/">
                    {(username !== null) ? <ImageFolders /> : <Redirect to="/login" />}
                </Route>
            </Switch>
        </div>
  );
};

export default App;
