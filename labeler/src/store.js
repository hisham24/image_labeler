import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';

import canvasReducer from './reducers/canvasReducer';
import imageReducer from './reducers/imageReducer';
import uploadReducer from './reducers/uploadReducer.js';
import sessionReducer from './reducers/sessionReducer';

const reducer = combineReducers({
  canvasTool: canvasReducer,
  imageTool: imageReducer,
  uploadTool: uploadReducer,
  sessionTool: sessionReducer
});

const rootReducer = (state, action) => {
  if (action.type === 'USER_LOGOUT') {
    localStorage.clear();
    return reducer(undefined, action);
  }
  return reducer(state, action);
};

export const logout = () => {
  return {
    type: 'USER_LOGOUT'
  };
};

const store = createStore(
  rootReducer,
  composeWithDevTools(
    applyMiddleware(thunk)
  )
);

export default store;
