const canvasReducer = (state = { images: [], imageId: '', width: 0, height: 0, imageSrc: null }, action) => {
  switch (action.type) {
    case 'INIT_IMAGES':
      return {
        ...state,
        images: action.data.images
      };
    case 'SET_IMAGE':
      return {
        ...state,
        imageId: action.data.imageId
      };
    case 'SET_IMAGE_DIMENS':
      return {
        ...state,
        width: action.data.width,
        height: action.data.height
      };
    case 'SET_IMAGE_SRC':
      return {
        ...state,
        imageSrc: action.data.imageSrc
      };
    default:
      return state;
  }
};

export const initialiseImages = (images) => {
  return {
    type: 'INIT_IMAGES',
    data: {
      images
    }
  };
};

export const setImage = (imageId) => {
  return {
    type: 'SET_IMAGE',
    data: {
      imageId
    }
  };
};

export const setImageDimens = (width, height) => {
  return {
    type: 'SET_IMAGE_DIMENS',
    data: {
      width,
      height
    }
  };
};

export const setImageSrc = (imageSrc) => {
  return {
    type: 'SET_IMAGE_SRC',
    data: {
      imageSrc
    }
  };
};

export default canvasReducer;
