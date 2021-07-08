import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';

import canvasReducer from './reducers/canvasReducer';
import imageReducer from './reducers/imageReducer';
import uploadReducer from './reducers/uploadReducer.js';

const reducer = combineReducers({
    canvasTool: canvasReducer,
    imageTool: imageReducer,
    uploadTool: uploadReducer,
});

const store = createStore(
    reducer,
    composeWithDevTools(
        applyMiddleware(thunk)
    )
);

export default store;