import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import imageLabelService from '../services/imageLabels';
import { logout } from '../store';
import { setImage, setImageSrc } from '../reducers/imageReducer';
import { clearRect } from '../reducers/canvasReducer';
import { setAlert } from '../reducers/sessionReducer';
import {
  List,
  ListItem,
  ListItemText,
  ListSubheader
} from '@material-ui/core';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import Paper from '@material-ui/core/Paper';
const FilePicker = () => {
  const [selectedIndex, setIndex] = useState(0);
  const dispatch = useDispatch();
  // const [ bboxes, selectedIndex ] = useSelector(state => [state.canvasTool.rects, state.canvasTool.index]);
  const [images, canvasHeight, username, imageFolder, bearerToken] = useSelector(state => [
    state.imageTool.images,
    state.canvasTool.canvasHeight,
    state.sessionTool.username,
    state.sessionTool.imageFolder,
    state.sessionTool.bearerToken
  ]);

  const handleListItemClick = async (event, index) => {
    event.preventDefault();
    if (selectedIndex !== index) {
      setIndex(index);
      dispatch(setImage(images[index]));
      dispatch(clearRect());
      try {
        const response = await imageLabelService.getImage(username, imageFolder, images[index], bearerToken);
        const data = URL.createObjectURL(response);
        dispatch(setImageSrc(data));
      } catch (err) {
        console.log('Error is:', err);
        if (err.response.status === 401) {
          console.log('Logging out');
          dispatch(logout());
          dispatch(setAlert(true, 'Session expired. Please login'));
        }
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
    <CssBaseline />
      <Paper style={{ maxHeight: canvasHeight, overflow: 'auto' }}>
        <List
            aria-labelledby="list of images"
            subheader={
                <ListSubheader id="list of images">
                  IMAGES
                </ListSubheader>
            }
        >
            {images.map((image, index) =>
                <ListItem
                    button
                    selected={selectedIndex === index}
                    onClick={(event) => handleListItemClick(event, index)}
                    key={index}
                >
                    <ListItemText
                        primary={image}
                    />
                </ListItem>
            )}
        </List>
      </Paper>
    </Container>
  );
};

export default FilePicker;
