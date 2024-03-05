import React, { useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

const AudioPlayer = ({ audioFile }) => {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const handlePlay = () => {
    wavesurfer.current.play();
  };

  const handlePause = () => {
    wavesurfer.current.pause();
  };
  useEffect(() => {
    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'violet',
      progressColor: 'purple',
    });

    if (audioFile) {
      wavesurfer.current.load(audioFile);
    }

    return () => {
      wavesurfer.current.destroy();
    };
  }, [audioFile]);

  return (
    <>
      <div ref={waveformRef} />
      <button onClick={handlePlay}>Play</button>
      <button onClick={handlePause}>Pause</button>
    </>
  );
};

export default AudioPlayer;
