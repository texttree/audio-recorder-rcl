import React, { useRef, useEffect, useMemo } from 'react';
import { useWavesurfer } from '@wavesurfer/react';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import Regions from 'wavesurfer.js/dist/plugins/regions.esm.js';

const AudioPlayer = ({ url }) => {
  const containerRef = useRef();

  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    url,
    waveColor: 'purple',
    height: '100',
    plugins: useMemo(() => [TimelinePlugin.create(), Regions.create()], []),
    dragToSeek: true,
    enableDragSelection: true,
  });

  const onPlayPause = () => {
    wavesurfer && wavesurfer.playPause();
    console.log(wavesurfer);
  };

  return (
    <>
      <div ref={containerRef} />
      <button onClick={onPlayPause} style={{ marginTop: '10px' }}>
        Play/Pause
      </button>
    </>
  );
};

export default AudioPlayer;
