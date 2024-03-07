import React, { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { copy, cut } from './helpers';

const AudioEditor = ({ url }) => {
  const waveformRef = useRef(null);
  const waveformRef2 = useRef(null);
  const [audioData, setAudioData] = useState(null);
  const [mainWs, setMainWs] = useState(null);
  const [copiedWs, setCopiedWs] = useState(null);

  const [coordinates, setCoordinates] = useState(null);
  const [wsRegionInstance, setWsRegionInstance] = useState(null);
  const [copiedAudio, setCopiedAudio] = useState(null);

  useEffect(() => {
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'green',
      progressColor: 'purple',
      cursorColor: 'navy',
      url,
      plugins: [TimelinePlugin.create()],
      sampleRate: 44100, //TODO пока хардкод, надо передавать
    });
    wavesurfer.on('ready', async () => {
      const decodedData = wavesurfer.getDecodedData();
      setAudioData(decodedData);
    });
    const wsRegions = wavesurfer.registerPlugin(RegionsPlugin.create());

    wsRegions.enableDragSelection({
      color: 'rgba(255, 0, 0, 0.1)',
    });
    wsRegions.on('region-created', (region) => {
      if (wsRegions?.regions.length > 1) {
        wsRegions.clearRegions();
      } else {
        setCoordinates({ start: region.start, end: region.end });
      }
    });

    wavesurfer.on('interaction', () => {
      wsRegions.clearRegions();
    });
    setMainWs(wavesurfer);
    setWsRegionInstance(wsRegions);
    return () => {
      wavesurfer.destroy();
    };
  }, []);

  const copyNewChunk = () => {
    if (!coordinates) {
      return;
    }
    const chunk = copy(audioData, coordinates.start, coordinates.end);
    setCopiedAudio(chunk);
    const wavesurfer = WaveSurfer.create({
      container: waveformRef2.current,
      waveColor: 'green',
      progressColor: 'purple',
      cursorColor: 'navy',
      url: chunk,
      sampleRate: audioData.sampleRate,
    });

    setCopiedWs(wavesurfer);
  };

  const cutChunk = () => {
    if (!coordinates) {
      return;
    }
    const chunk = cut(audioData, coordinates.start, coordinates.end);

    mainWs.load(chunk);
    wsRegionInstance.clearRegions();
  };

  const onPlayPauseCopied = () => {
    copiedWs && copiedWs.playPause();
  };
  const onPlayPauseMain = () => {
    mainWs && mainWs.playPause();
  };

  return (
    <>
      <div ref={waveformRef}></div>
      <button onClick={copyNewChunk}>copy</button>
      <button onClick={cutChunk}>cut chunk</button>
      <button disabled={!copiedAudio} onClick={onPlayPauseMain}>
        play
      </button>
      <div ref={waveformRef2}></div>
      {copiedAudio && <button onClick={onPlayPauseCopied}>play</button>}
    </>
  );
};

export default AudioEditor;
