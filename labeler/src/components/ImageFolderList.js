import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAlert, chooseImageFolder, setImageFolders } from '../reducers/sessionReducer';
import { logout } from '../store';
import imageLabelService from '../services/imageLabels';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import {
  List,
  ListItem,
  ListItemText,
  ListSubheader
} from '@material-ui/core';

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

const ImageFolderList = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const classes = useStyles();
  const [username, imageFolders, bearerToken] = useSelector(state => [state.sessionTool.username,
    state.sessionTool.imageFolders,
    state.sessionTool.bearerToken
  ]);
  const [selectedIndex, setIndex] = useState(0);

  useEffect(() => {
    const getImageFolders = async () => {
      try {
        const data = await imageLabelService.getImageFolders(username, bearerToken);
        dispatch(setImageFolders(data.image_folders));
      } catch (err) {
        console.log('ERR IS', err);
        if (err.response.status === 401) {
          console.log('Logging out');
          dispatch(logout());
          dispatch(setAlert(true, 'Session expired. Please login'));
        }
      }
    };
    getImageFolders();
  }, [dispatch]);

  const handleListItemClick = (event, index) => {
    event.preventDefault();
    setIndex(index);
  };

  const handleLabelImagesClick = (event) => {
    event.preventDefault();
    dispatch(chooseImageFolder(imageFolders[selectedIndex]));
    history.push('/label');
  };

  return (
      <Container component="main" maxWidth="xs">
      <CssBaseline />
        <div className={classes.paper}>
          <Grid container>
            <Grid item xs={12}>
              <Paper style={{ maxHeight: window.innerHeight * 0.5, maxWidth: window.innerWidth, overflow: 'auto' }}>
                <List
                    aria-labelledby="list of images"
                    subheader={
                        <ListSubheader id="list of images">
                          IMAGE FOLDERS
                        </ListSubheader>
                    }
                >
                    {imageFolders.map((imageFolder, index) =>
                        <ListItem
                            button
                            selected={selectedIndex === index}
                            onClick={(event) => handleListItemClick(event, index)}
                            key={index}
                        >
                            <ListItemText
                                primary={imageFolder}
                            />
                        </ListItem>
                    )}
                </List>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleLabelImagesClick}
              >
                label images
              </Button>
            </Grid>
          </Grid>
      </div>
    </Container>
  );
};

export default ImageFolderList;
