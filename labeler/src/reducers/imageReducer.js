import imageLabelService from '../services/imageLabels';

const canvasReducer = (state = { images: [], image_id: '', width: 0, height: 0, }, action) => {
    switch (action.type) {
        case 'INIT_IMAGES':
            return {
                ...state,
                images: action.data.images,
            };
        case 'SET_IMAGE':
            return {
                ...state,
                image_id: action.data.image_id,
                width: action.data.width,
                height: action.data.height,
            };
        default:
            return state;
    }
}

export const initialiseImages = (username, imageFolder) => {
    return async dispatch => {
        const saved_images = await imageLabelService.getImages(username, imageFolder);
        dispatch({
            type: 'INIT_IMAGES',
            data: {
                images: saved_images.images,
            },
        });
    }
}

export const setImage = (image_id, width, height) => {
    return {
        type: 'SET_IMAGE',
        data: {
                image_id,
                width,
                height,
        },
    };
}

export default canvasReducer;