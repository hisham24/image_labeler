import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedRect } from '../reducers/canvasReducer';
import {
    List,
    ListItem,
    ListItemText,
    ListSubheader,
} from '@material-ui/core';

const BboxList = () => {
  const dispatch = useDispatch();
  const [ bboxes, selectedIndex ] = useSelector(state => [state.canvasTool.rects, state.canvasTool.index]);
  const handleListItemClick = (event, index) => {
    event.preventDefault();
    dispatch(setSelectedRect(index));
  };

  return (
    <div>
      <List 
        aria-labelledby="list of bboxes"
        subheader={
            <ListSubheader component="div" id="list of bboxes">
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
    </div>
  );
}

export default BboxList;