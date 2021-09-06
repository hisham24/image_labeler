import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useCanvas } from '../hooks/useCanvas';
import { initialiseCanvas, addRect, modifyRect, clearRect } from '../reducers/canvasReducer';
import { initialiseImages, setImage, setImageDimens, setImageSrc } from '../reducers/imageReducer';
import { setAlert } from '../reducers/sessionReducer';
import imageLabelService from '../services/imageLabels';
import { clip } from '../utils';
import { logout } from '../store';

const Canvas = () => {
  const dispatch = useDispatch();
  const [{ point, isClicked }, username, imageFolder, bearerToken, imageSrc] = useSelector(state => [
    state.canvasTool,
    state.sessionTool.username,
    state.sessionTool.imageFolder,
    state.sessionTool.bearerToken,
    state.imageTool.imageSrc
  ]);
  const imageRef = useRef(null);
  const [canvasRef, canvasWidth, canvasHeight] = useCanvas(imageRef);

  useEffect(() => {
    const getImage = async () => {
      try {
        const savedImages = await imageLabelService.getImages(username, imageFolder, bearerToken);
        console.log('saved_images are', savedImages);
        dispatch(initialiseImages(savedImages.images));
        dispatch(setImage(savedImages.images[0]));
        const data = await imageLabelService.getImage(username, imageFolder, savedImages.images[0], bearerToken);
        const imageData = URL.createObjectURL(data);
        dispatch(setImageSrc(imageData));
      } catch (err) {
        console.log('Error is:', err);
        if (err.response.status === 401) {
          console.log('Logging out');
          dispatch(logout());
          dispatch(setAlert(true, 'Session expired. Please login'));
        }
      }
    };
    getImage();
  }, [dispatch]);

  const imageStyle = {
    display: 'none'
  };

  const canvasStyle = {
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#f5f5f5'
  };

  const handleMouseDown = (event) => {
    event.preventDefault();
    if (event.button === 0) {
      const x = clip(event.clientX - event.target.offsetLeft, 0, canvasWidth - 2);
      const y = clip(event.clientY - event.target.offsetTop, 0, canvasHeight - 2);
      const rect = { x: point.x, y: point.y, w: 1, h: 1 };
      dispatch(addRect({ x, y }, rect));
    }
  };

  const handleMouseMove = (event) => {
    event.preventDefault();
    if ((event.button === 0) && isClicked) {
      const mouseX = event.clientX - event.target.offsetLeft;
      const mouseY = event.clientY - event.target.offsetTop;
      const x = clip(Math.min(point.x, mouseX), 0, canvasWidth - 2);
      const y = clip(Math.min(point.y, mouseY), 0, canvasHeight - 2);
      const width = clip(Math.max(point.x, mouseX) - x, 1, canvasWidth - 1 - x);
      const height = clip(Math.max(point.y, mouseY) - y, 1, canvasHeight - 1 - y);
      const rect = { x, y, w: width, h: height };
      dispatch(modifyRect(true, rect));
    }
  };

  const handleMouseUp = (event) => {
    event.preventDefault();
    if ((event.button === 0) && isClicked) {
      const mouseX = event.clientX - event.target.offsetLeft;
      const mouseY = event.clientY - event.target.offsetTop;
      const x = clip(Math.min(point.x, mouseX), 0, canvasWidth - 2);
      const y = clip(Math.min(point.y, mouseY), 0, canvasHeight - 2);
      const width = clip(Math.max(point.x, mouseX) - x, 1, canvasWidth - 1 - x);
      const height = clip(Math.max(point.y, mouseY) - y, 1, canvasHeight - 1 - y);
      const rect = { x, y, w: width, h: height };
      dispatch(modifyRect(false, rect));
      // console.log(event.nativeEvent.offsetX, event.nativeEvent.offsetY, canvasHeight, canvasWidth, x, y, x + width,  y + height);
    }
  };

  const handleMouseOut = (event) => {
    event.preventDefault();
    handleMouseUp(event);
  };

  const handleClearCanvas = (event) => {
    event.preventDefault();
    dispatch(clearRect());
  };

  const loadImage = () => {
    dispatch(initialiseCanvas(
      canvasWidth,
      canvasHeight
    ));
    dispatch(setImageDimens(
      imageRef.current.naturalWidth,
      imageRef.current.naturalHeight
    ));
    canvasRef.current.getContext('2d').drawImage(imageRef.current, 0, 0, canvasWidth, canvasHeight);
  };

  return (
        <div>
            <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                style={canvasStyle}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseOut={handleMouseOut}
            />
            <img
                ref={imageRef}
                onLoad={loadImage}
                // src={process.env.PUBLIC_URL + '/images/f10.png'}
                src={imageSrc}
                style={imageStyle}
            />
            <button onClick={handleClearCanvas}>CLEAR</button>
        </div>
  );
};

export default Canvas;
