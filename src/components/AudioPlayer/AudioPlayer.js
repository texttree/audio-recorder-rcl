import React, { useRef, useEffect, useMemo } from 'react';
import { useWavesurfer } from '@wavesurfer/react';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';

const AudioPlayer = ({ url }) => {
  const containerRef = useRef();
  const { wavesurfer, isReady, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    url,
    waveColor: 'purple',
    height: '100',
    plugins: useMemo(() => [TimelinePlugin.create()], []),
  });
  const onPlayPause = () => {
    wavesurfer && wavesurfer.playPause();
  };

  return (
    <>
      <div ref={containerRef} />
      <button onClick={onPlayPause}>Play/Pause</button>
    </>
  );
};

export default AudioPlayer;
