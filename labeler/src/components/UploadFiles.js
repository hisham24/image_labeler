import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  setSelectedFiles,
  startUploadFiles,
  updateUploadProgress,
  updateUploadStatus,
  stopUploadFiles,
  changeProgressStatus
} from '../reducers/uploadReducer';
import { addImageFolder, setAlert } from '../reducers/sessionReducer';
import { logout } from '../store';
import imageLabelService from '../services/imageLabels';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import LinearProgress from '@material-ui/core/LinearProgress';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';

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

const LinearProgressWithLabel = (props) => {
  return (
    <Box display="flex" alignItems="center">
      <Box width="100%" mr={1}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box minWidth={35}>
        <Typography variant="body2" color="textSecondary">{`${Math.round(
          props.value
        )}%`}</Typography>
      </Box>
    </Box>
  );
};

LinearProgressWithLabel.propTypes = {
  /**
   * The value of the progress indicator for the determinate and buffer variants.
   * Value between 0 and 100.
   */
  value: PropTypes.number.isRequired
};

const UploadFiles = () => {
  const dispatch = useDispatch();
  const classes = useStyles();
  const [{ progressInfos, selectedFiles, message, uploading }, username, bearerToken] = useSelector(state => [
    state.uploadTool,
    state.sessionTool.username,
    state.sessionTool.bearerToken
  ]);
  const [imageFolderName, setImageFolderName] = useState('');
  const [selectedIndex, setIndex] = useState(0);

  const selectFiles = (event) => {
    dispatch(setSelectedFiles(event.target.files));
    setImageFolderName('');
  };

  const uploadFiles = async (event) => {
    event.preventDefault();
    try {
      await imageLabelService.uploadMetadata(username, imageFolderName, bearerToken);
    } catch (err) {
      if (err.response.status === 401) {
        console.log('Logging out');
        dispatch(logout());
        dispatch(setAlert(true, 'Login again'));
      } else {
        dispatch(setAlert(true, 'Error uploading folder'));
      }
      return;
    }
    const _progressInfos = [];
    for (let i = 0; i < selectedFiles.length; ++i) {
      _progressInfos.push({ percentage: 0, filename: selectedFiles[i].name, status: true });
    }
    dispatch(startUploadFiles(_progressInfos));
    const promises = [];
    for (let i = 0; i < selectedFiles.length; ++i) {
      promises.push(uploadFile(i, selectedFiles[i]));
    }
    await Promise.all(promises);
    dispatch(stopUploadFiles());
    dispatch(addImageFolder(imageFolderName));
  };

  const uploadFile = async (index, file) => {
    try {
      const response = await imageLabelService.uploadImage(file, username, imageFolderName, bearerToken, (progressEvent) => {
        const percentage = Math.round((100 * progressEvent.loaded) / progressEvent.total);
        dispatch(updateUploadProgress(index, percentage));
      }, bearerToken);
      dispatch(updateUploadStatus(`Uploaded the file successfully: ${file.name}`));
      console.log('Successfully uploaded file:', response);
    } catch (err) {
      console.log('Error uploading file:', err);
      if (err.response.status === 401) {
        console.log('Logging out');
        dispatch(setAlert(true, 'Login again'));
        dispatch(logout());
      }
      dispatch(updateUploadProgress(index, 0));
      dispatch(updateUploadStatus(`Could not upload the file: ${file.name}`));
      dispatch(changeProgressStatus(index, false));
    }
  };

  const handleListItemClick = (event, index) => {
    event.preventDefault();
    setIndex(index);
  };

  return (
        <Container component="main" maxWidth="xs">
        <CssBaseline />
          <div className={classes.paper}>
            <Grid
              container
            >
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  component="label"
                >
                  Choose Files
                  <input
                    type="file"
                    multiple
                    hidden
                    onChange={selectFiles}
                  />
                </Button>
              </Grid>
              {selectedFiles &&
                <Grid item xs={12} sm={6}>
                  {`SELECTED ${selectedFiles.length} FILES.`}
                </Grid>
              }
              <Grid item xs={12}>
                <form className={classes.form} onSubmit={uploadFiles}>
                  <TextField
                    value={imageFolderName}
                    onChange={({ target }) => setImageFolderName(target.value)}
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    id="image-folder-name"
                    label="Image Folder Name"
                    name="image-folder-name"
                    autoComplete="folder"
                    autoFocus
                    disabled={!selectedFiles || uploading}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    disabled={!selectedFiles || uploading}
                  >
                    Upload
                  </Button>
                </form>
                {progressInfos.reduce((acc, progressInfo) => acc + (progressInfo.percentage !== 100), 0) !== 0 && (
                  <Paper style={{ maxHeight: window.innerHeight * 0.3, overflow: 'auto' }}>
                    <List
                      aria-labelledby="list of progress infos"
                      subheader={
                          <ListSubheader id="list of progress infos">
                            PROGRESS INFORMATION
                          </ListSubheader>
                      }
                    >
                      {progressInfos.filter(progressInfo => progressInfo.status === true).map((progressInfo, index) =>
                        <ListItem
                          key={index}
                        >
                          <span>{progressInfo.filename}</span>
                          <LinearProgressWithLabel variant='determinate' value={progressInfo.percentage} />
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                )}
                {message.length > 0 && (
                  <Paper style={{ maxHeight: window.innerHeight * 0.3, overflow: 'auto' }}>
                    <List
                      aria-labelledby="list of upload statuses"
                      subheader={
                          <ListSubheader id="list of upload statuses">
                            UPLOAD STATUS
                          </ListSubheader>
                      }
                    >
                      {message.map((status, index) =>
                        <ListItem
                          button
                          selected={selectedIndex === index}
                          onClick={(event) => handleListItemClick(event, index)}
                          key={index}
                        >
                          <ListItemText
                            primary={status}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                )}
              </Grid>
            </Grid>
        </div>
      </Container>
  );
};

export default UploadFiles;
