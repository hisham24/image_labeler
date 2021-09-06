const sessionReducer = (state = { username: null, bearerToken: null, imageFolder: null, imageFolders: [], signUpStatus: false, alertStatus: false, alertMessage: '' }, action) => {
  switch (action.type) {
    case 'SET_LOGIN':
      return {
        ...state,
        username: action.data.username,
        bearerToken: action.data.bearerToken
      };
    case 'SET_IMAGE_FOLDER':
      return {
        ...state,
        imageFolder: action.data.imageFolder
      };
    case 'SET_IMAGE_FOLDERS':
      return {
        ...state,
        imageFolders: action.data.imageFolders
      };
    case 'ADD_IMAGE_FOLDER':
      return {
        ...state,
        imageFolders: [...state.imageFolders, action.data.imageFolder]
      };
    case 'SET_SIGNUP_STATUS':
      return {
        ...state,
        signUpStatus: action.data.status
      };
    case 'SET_ALERT':
      return {
        ...state,
        alertStatus: action.data.status,
        alertMessage: action.data.message
      };
    default:
      return state;
  }
};

export const loginSession = (username, token) => {
  return {
    type: 'SET_LOGIN',
    data: {
      username,
      bearerToken: `Bearer ${token}`
    }
  };
};

export const chooseImageFolder = (imageFolder) => {
  return {
    type: 'SET_IMAGE_FOLDER',
    data: {
      imageFolder
    }
  };
};

export const setImageFolders = (imageFolders) => {
  return {
    type: 'SET_IMAGE_FOLDERS',
    data: {
      imageFolders
    }
  };
};

export const addImageFolder = (imageFolder) => {
  return {
    type: 'ADD_IMAGE_FOLDER',
    data: {
      imageFolder
    }
  };
};
export const setSignUpStatus = (status) => {
  return {
    type: 'SET_SIGNUP_STATUS',
    data: {
      status
    }
  };
};

export const setAlert = (status, message = '') => {
  return {
    type: 'SET_ALERT',
    data: {
      status,
      message
    }
  };
};

export default sessionReducer;
