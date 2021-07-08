const uploadReducer = (state = {
    progressInfos: [],
    selectedFiles: null,
    message: [],
    uploading: false,
}, action) => {
    switch (action.type) {
        case 'SET_FILES':
            return {
                ...state,
                uploading: false,
                selectedFiles: action.data.selectedFiles,
            };
        case 'START_UPLOAD':
            return {
                ...state,
                uploading: true,
                progressInfos: action.data.progressInfos,
            };

        case 'UPLOAD_PROGRESS':
            return {
                ...state,
                progressInfos: [...state.progressInfos.slice(0, action.data.index), 
                    {
                        ...state.progressInfos[action.data.index],
                        percentage: action.data.percentage,
                    },
                    ...state.progressInfos.slice(action.data.index + 1),
                ],
            };

        case 'CHANGE_PROGRESS':
            return {
                ...state,
                progressInfos: [...state.progressInfos.slice(0, action.data.index), 
                    {
                        ...state.progressInfos[action.data.index],
                        status: action.data.status,
                    },
                    ...state.progressInfos.slice(action.data.index + 1),
                ],
            };   
        
        case 'SET_STATUS':
            return {
                ...state,
                message: [...state.message, action.data.message],
            };
        case 'STOP_UPLOAD':
            return {
                ...state,
                // progressInfos: [],
                uploading: false,
            }

        case 'CLEAR_PROGRESS':
            return {
                ...state,
                progressInfos: [],
            }
        default:
            return state;
    }
}

export const setSelectedFiles = files => {
    return {
        type: 'SET_FILES',
        data: {
            selectedFiles: files,
        },
    };
}

export const startUploadFiles = progress => {
    return {
        type: 'START_UPLOAD',
        data: {
            progressInfos: progress,
        },
    };
}

export const updateUploadProgress = (index, percentage) => {
    return {
        type: 'UPLOAD_PROGRESS',
        data: {
            index,
            percentage,
        },
    };
}

export const updateUploadStatus = message => {
    return {
        type: 'SET_STATUS',
        data: {
            message,
        },
    };
}

export const stopUploadFiles = () => {
    return {
        type: 'STOP_UPLOAD',
    };
}

export const changeProgressStatus = (index, status) => {
    return {
        type: 'CHANGE_PROGRESS',
        data: {
            index,
            status,
        }
    };
}

export default uploadReducer;