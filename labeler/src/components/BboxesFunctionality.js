import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setRect } from '../reducers/canvasReducer';
import imageLabelService from '../services/imageLabels';
import { clip } from '../utils';
import {
    Button,
    ButtonGroup,
} from '@material-ui/core';

const BboxesFunctionality = () => {
    const dispatch = useDispatch();
    const [ image, imageWidth, imageHeight, rects, canvasWidth, canvasHeight ] = useSelector(state => [
        state.imageTool.image_id, 
        state.imageTool.width, 
        state.imageTool.height, 
        state.canvasTool.rects,
        state.canvasTool.canvasWidth,
        state.canvasTool.canvasHeight,
    ]);

    const getBboxes = async () => {
        try {
            const response = await imageLabelService.getExistingBboxes(image);
            console.log('This is', response.bboxes);
            dispatch(setRect(response.bboxes.map(rect => {
                const x = clip(Math.round(rect[0] / imageWidth * canvasWidth), 0, canvasWidth-2);
                const y = clip(Math.round(rect[1] / imageHeight * canvasHeight), 0, canvasHeight-2);
                const w = clip(Math.round(rect[2] / imageWidth * canvasWidth), 1, canvasWidth-1-x);
                const h = clip(Math.round(rect[3] / imageHeight * canvasHeight), 1, canvasHeight-1-y);
                return {
                    x,
                    y,
                    w, 
                    h,
                };
            })));
        } catch (err) {
            console.log('ERRROR:',err);
        }
    }

    const saveBboxes = async () => {
        const bboxes = rects.map(rect => {
            const x = clip(Math.round(rect.x / canvasWidth * imageWidth), 0, imageWidth-2);
            const y = clip(Math.round(rect.y / canvasHeight * imageHeight), 0, imageHeight-2);
            const w = clip(Math.round(rect.w / canvasWidth * imageWidth), 1, imageWidth-1-x);
            const h = clip(Math.round(rect.h / canvasHeight * imageHeight), 1, imageHeight-1-y);
            return {
                x,
                y,
                w,
                h,
            };
        })
        await imageLabelService.updateBboxes(image, bboxes);
    }
    return (
        <div>
            <ButtonGroup size="large" color="primary" aria-label="get and save bboxes">
                <Button
                    onClick={getBboxes}
                >
                    Get existing bboxes
                </Button>
                <Button
                    onClick={saveBboxes}
                >
                    Save bboxes
                </Button>
            </ButtonGroup>
        </div>
    );
}

export default BboxesFunctionality;