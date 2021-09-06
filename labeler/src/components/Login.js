// Adapted from https://github.com/mui-org/material-ui/tree/master/docs/src/pages/getting-started/templates/sign-in

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Footer from './Footer';
import { loginSession, setSignUpStatus, setAlert } from '../reducers/sessionReducer';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import { Link as RouterLink } from 'react-router-dom';
import authService from '../services/auth';

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

const Login = () => {
  const dispatch = useDispatch();
  const classes = useStyles();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    console.log('YEET');
    dispatch(setSignUpStatus(false));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      console.log('Attempt logging in');
      const user = await authService.loginUser(username, password);
      dispatch(loginSession(user.username, user.token));
      dispatch(setAlert(false));
      window.localStorage.setItem(
        'loggedUser', JSON.stringify(user)
      );
    } catch (err) {
      console.log('Err is ', err.response);
      if (err.response.status === 401) {
        dispatch(setAlert(true, 'Incorrect username or password'));
      } else {
        dispatch(setAlert(true, 'Error logging in'));
      }
      setPassword('');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        {/* {alertComp === 'Login' &&
          <Alert severity="error">{alertMessage}</Alert>
        } */}
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <form className={classes.form} onSubmit={handleSubmit}>
          <TextField
            value={username}
            onChange={({ target }) => setUsername(target.value)}
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
          />
          <TextField
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
          >
            Login
          </Button>
          <Grid container>
            <Grid item>
              <Link variant="body2"
               component={RouterLink}
               onClick={(event) => dispatch(setAlert(false))}
               to='/signup'>
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
        </form>
      </div>
      <Box mt={8}>
        <Footer />
      </Box>
    </Container>
  );
};

export default Login;
