import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LinearProgress, Box, Typography, } from '@material-ui/core';
import PropTypes from 'prop-types';
import { 
    setSelectedFiles, 
    startUploadFiles,
    updateUploadProgress,
    updateUploadStatus,
    stopUploadFiles,
    changeProgressStatus,
} from '../reducers/uploadReducer';
import imageLabelService from '../services/imageLabels';

const LinearProgressWithLabel = (props) => {
  return (
    <Box display="flex" alignItems="center">
      <Box width="100%" mr={1}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box minWidth={35}>
        <Typography variant="body2" color="textSecondary">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  );
}

LinearProgressWithLabel.propTypes = {
  /**
   * The value of the progress indicator for the determinate and buffer variants.
   * Value between 0 and 100.
   */
  value: PropTypes.number.isRequired,
};


const UploadFiles = () => {
    const dispatch = useDispatch();
    const { progressInfos, selectedFiles, message, uploading } = useSelector(state => state.uploadTool);

    const selectFiles = (event) => {
        // event.preventDefault()
        dispatch(setSelectedFiles(event.target.files));
        console.log(selectedFiles)
    }

    const uploadFiles = async () => {
        let _progressInfos = [];
        for (let i = 0; i < selectedFiles.length; ++i) {
            _progressInfos.push({ percentage: 0, filename: selectedFiles[i].name, status: true })
        }
        dispatch(startUploadFiles(_progressInfos));
        const promises = [];
        for (let i = 0; i < selectedFiles.length; ++i) {
            promises.push(uploadFile(i, selectedFiles[i]));
        }
        await Promise.all(promises);
        dispatch(stopUploadFiles());
    }

    const uploadFile = async (index, file) => {
        try {
            const response = await imageLabelService.uploadImage(file, (progressEvent) => {
                const percentage = Math.round((100 * progressEvent.loaded) / progressEvent.total);
                dispatch(updateUploadProgress(index, percentage));
            });
            dispatch(updateUploadStatus(`Uploaded the file successfully: ${file.name}`));
            console.log('Successfully uploaded file:', response);
        } catch (err) {
            console.log('Error uploading file:',err);
            dispatch(updateUploadProgress(index, 0));
            dispatch(updateUploadStatus(`Could not upload the file: ${file.name}`));
            dispatch(changeProgressStatus(index, false));
        }
    }
    

    return (
        <div>
        {progressInfos.length !== 0 &&
          progressInfos.map((progressInfo, index) => (
            progressInfo.status &&
            <div key={index}>
              <span>{progressInfo.filename}</span>
              {/* <div className="progress">
                <div
                  className="progress-bar progress-bar-info"
                  role="progressbar"
                  aria-valuenow={progressInfo.percentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  style={{ width: progressInfo.percentage + "%" }}
                >
                  {progressInfo.percentage}%
                </div>
              </div> */}
              <LinearProgressWithLabel variant='determinate' value={progressInfo.percentage} />
            </div>
          ))
        }
        <div>
          <div>
            <label className="btn btn-default p-0">
              <input type="file" multiple onChange={selectFiles} />
            </label>
          </div>

          <div>
            <button
              className="btn btn-success btn-sm"
              disabled={!selectedFiles || uploading}
              onClick={uploadFiles}
            >
              Upload
            </button>
          </div>
        </div>

        {message.length > 0 && (
          <div>
            <ul>
              {message.map((item, i) => {
                return <li key={i}>{item}</li>;
              })}
            </ul>
          </div>
        )}
      </div>
    );
}

export default UploadFiles;