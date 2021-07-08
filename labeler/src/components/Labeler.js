import React from 'react';
import { useEffect } from 'react';
import Canvas from './Canvas';
import FilePicker from './FilePicker';
import BboxList from './BboxList';
import BboxesFunctionality from './BboxesFunctionality';
import UploadFiles from './UploadFiles';
import imageLabelService from '../services/imageLabels';
import { 
    Grid, 
    Paper 
} from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { initialiseImages } from '../reducers/imageReducer';

const Labeler = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(initialiseImages('reactUser', 'newFolder'))
      },[dispatch]); 
    const [ canvasWidth, canvasHeight ] = useSelector(state => [state.canvasTool.canvasWidth, state.canvasTool.canvasHeight] );
    return (
        <div>
            <Grid
                container
                direction="row"
                justify="flex-start"
                alignItems="flex-start"
            >
                <Grid item xs>
                    <FilePicker />
                </Grid>
                <Grid item xs>
                    <Canvas />
                </Grid>
                <Grid item={true} xs>
                    <Paper style={{maxHeight: canvasHeight, overflow: 'auto'}}>
                        <BboxList />
                    </Paper>
                </Grid>
            </Grid>
            <button onClick={() => imageLabelService.uploadMetadata()}>
                upload
            </button>
            <button onClick={() => imageLabelService.getImages('reactUser', 'newFolder')}>
                get the images
            </button>
            <UploadFiles />
            <BboxesFunctionality />
        </div>
    );
}

export default Labeler;
