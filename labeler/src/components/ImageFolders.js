import React from 'react';
import ImageFolderList from './ImageFolderList';
import UploadFiles from './UploadFiles';
import Footer from './Footer';
import Grid from '@material-ui/core/Grid';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import Box from '@material-ui/core/Box';

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
    <Container component="main" maxWidth="lg">
      <CssBaseline />
      <div className={classes.paper}>
          <Grid
            container
            direction="row"
            justifyContent="center"
            alignItems="flex-start"
          >
            <Grid item xs={12} sm={6}>
              <ImageFolderList />
            </Grid>
            <Grid item xs={12} sm={6}>
              <UploadFiles />
            </Grid>
          </Grid>
      </div>
      <Box mt={5}>
        <Footer />
      </Box>
    </Container>
  );
};

export default Labeler;
