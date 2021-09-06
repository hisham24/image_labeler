const canvasReducer = (state = { canvasWidth: 0, canvasHeight: 0, point: { x: 0, y: 0 }, isClicked: false, rects: [], index: -1 }, action) => {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        canvasWidth: action.data.width,
        canvasHeight: action.data.height
      };
    case 'ADD_RECT':
      return {
        ...state,
        point: action.data.point,
        isClicked: true,
        rects: [...state.rects, action.data.rect]
      };
    case 'MODIFY_RECT':
      return {
        ...state,
        point: state.point,
        isClicked: action.data.isClicked,
        rects: [...state.rects.slice(0, -1), action.data.rect]
      };
    case 'SET_RECT':
      return {
        ...state,
        rects: action.data.rects
      };
    case 'CLEAR_RECT':
      return {
        ...state,
        point: { x: 0, y: 0 },
        isClicked: false,
        rects: []
      };
    case 'SET_SELECTED':
      return {
        ...state,
        index: action.data.index
      };
    default:
      return state;
  }
};

export const initialiseCanvas = (width, height) => {
  return {
    type: 'INIT',
    data: {
      width,
      height
    }
  };
};

export const addRect = (point, rect) => {
  return {
    type: 'ADD_RECT',
    data: {
      point,
      rect
    }
  };
};

export const modifyRect = (isClicked, rect) => {
  return {
    type: 'MODIFY_RECT',
    data: {
      isClicked,
      rect
    }
  };
};

export const setRect = (rects) => {
  return {
    type: 'SET_RECT',
    data: {
      rects
    }
  };
};

export const clearRect = () => {
  return {
    type: 'CLEAR_RECT'
  };
};

export const setSelectedRect = (index) => {
  return {
    type: 'SET_SELECTED',
    data: {
      index
    }
  };
};

export default canvasReducer;
