import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

// const SCALE = 0.1;
// const OFFSET = 80;
export const canvasWidth = window.innerWidth * 0.75;
export const canvasHeight = window.innerHeight * 0.75;

export const drawRectangle = (ctx, info) => {
  const { x, y, w, h } = info;
  ctx.beginPath();
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.rect(x, y, w, h);
  ctx.stroke();
};

export const useCanvas = (imageRef) => {
  const canvasRef = useRef(null);
  const rectangles = useSelector(state => state.canvasTool.rects);
  // console.log('Ref is', imageRef.current.naturalWidth);
  useEffect(() => {
    const canvasObj = canvasRef.current;
    const ctx = canvasObj.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(imageRef.current, 0, 0, canvasWidth, canvasHeight);
    rectangles.forEach((rect) => { drawRectangle(ctx, rect); });
  });
  return [canvasRef, canvasWidth, canvasHeight];
};
