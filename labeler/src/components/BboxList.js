import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedRect } from '../reducers/canvasReducer';
import {
  List,
  ListItem,
  ListItemText,
  ListSubheader
} from '@material-ui/core';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import Paper from '@material-ui/core/Paper';

const BboxList = () => {
  const dispatch = useDispatch();
  const [bboxes, selectedIndex, canvasHeight] = useSelector(state => [
    state.canvasTool.rects,
    state.canvasTool.index,
    state.canvasTool.canvasHeight
  ]);
  const handleListItemClick = (event, index) => {
    event.preventDefault();
    dispatch(setSelectedRect(index));
  };

  return (
    <Container component="main" maxWidth="xs">
    <CssBaseline />
      <Paper style={{ maxHeight: canvasHeight, overflow: 'auto' }}>
        <List
          aria-labelledby="list of bboxes"
          subheader={
              <ListSubheader id="list of bboxes">
                BOUNDING BOXES
              </ListSubheader>
          }
        >
            {bboxes.map((bbox, index) =>
                <ListItem
                    button
                    selected={selectedIndex === index}
                    onClick={(event) => handleListItemClick(event, index)}
                    key={index}
                >
                    <ListItemText
                        primary={
                            `x: ${bbox.x}, y: ${bbox.y}, w: ${bbox.w}, h: ${bbox.h}`
                        }
                    />
                </ListItem>
            )}
        </List>
      </Paper>
    </Container>
  );
};

export default BboxList;
