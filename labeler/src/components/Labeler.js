import React from 'react';
import Canvas from './Canvas';
import FilePicker from './FilePicker';
import BboxList from './BboxList';
import BboxesFunctionality from './BboxesFunctionality';
import Grid from '@material-ui/core/Grid';
import CssBaseline from '@material-ui/core/CssBaseline';
import Container from '@material-ui/core/Container';
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
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(3)
  },
  submit: {
    margin: theme.spacing(3, 0, 2)
  }
}));

const Labeler = () => {
  const classes = useStyles();
  return (
        <Container component="main" maxWidth={false}>
            <CssBaseline/>
            <div className={classes.paper}>
                <Grid
                    container
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="flex-start"
                >
                    <Grid item xs>
                        <FilePicker />
                    </Grid>
                    <Grid item xs>
                        <Canvas />
                    </Grid>
                    <Grid item xs>
                        <BboxList />
                    </Grid>
                </Grid>
                <BboxesFunctionality />
            </div>
        </Container>
  );
};

export default Labeler;
