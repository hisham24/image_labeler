import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedRect } from '../reducers/canvasReducer';
import {
    List,
    ListItem,
    ListItemText,
    ListSubheader,
} from '@material-ui/core';
import { useState } from 'react';
const FilePicker = () => {
    const [ selectedIndex, setIndex ] = useState(0); 
    const dispatch = useDispatch();
    // const [ bboxes, selectedIndex ] = useSelector(state => [state.canvasTool.rects, state.canvasTool.index]);
    const [ images ] = useSelector(state => [ state.imageTool.images ]);
    const handleListItemClick = (event, index) => {
      event.preventDefault();
    };
  
    return (
      <div>
        <List 
            aria-labelledby="list of images"
            subheader={
                <ListSubheader component="div" id="list of images">
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
      </div>
    );
  }
  
  export default FilePicker;