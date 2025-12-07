import React, { useEffect, useRef, useState } from 'react';
import { CameraStatus } from '../types';

interface CameraInputProps {
  onUpdate: (activity: number) => void;
  onStatusChange: (status: CameraStatus) => void;
}

const CameraInput: React.FC<CameraInputProps> = ({ onUpdate, onStatusChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const previousFrameData = useRef<Uint8ClampedArray | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, frameRate: 30 }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          onStatusChange(CameraStatus.ACTIVE);
          requestRef.current = requestAnimationFrame(processVideo);
        }
      } catch (err) {
        console.error("Camera access denied or error:", err);
        onStatusChange(CameraStatus.DENIED);
      }
    };

    startCamera();

    return () => {
      cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processVideo = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        // Downscale for performance
        const width = 64;
        const height = 48;
        
        ctx.drawImage(video, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        let diffSum = 0;
        const totalPixels = width * height;

        if (previousFrameData.current) {
          // Simple motion detection: Diff against previous frame
          for (let i = 0; i < data.length; i += 4) {
            // Check RGB channels
            const rDiff = Math.abs(data[i] - previousFrameData.current[i]);
            const gDiff = Math.abs(data[i + 1] - previousFrameData.current[i + 1]);
            const bDiff = Math.abs(data[i + 2] - previousFrameData.current[i + 2]);
            
            // Add to total difference
            diffSum += (rDiff + gDiff + bDiff);
          }
        }

        // Store current frame
        previousFrameData.current = new Uint8ClampedArray(data);

        // Normalize difference
        // Increased sensitivity: dividing by a smaller factor makes small movements trigger higher tension
        const normalizedDiff = Math.min(diffSum / (totalPixels * 25), 1.0);
        
        onUpdate(normalizedDiff);
      }
    }
    requestRef.current = requestAnimationFrame(processVideo);
  };

  return (
    <div className="hidden">
      <video ref={videoRef} playsInline muted width="320" height="240" />
      <canvas ref={canvasRef} width="64" height="48" />
    </div>
  );
};

export default CameraInput;