import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

function AudioMarkup({ url }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeRegion, setActiveRegion] = useState(null);

  const containerSurf = useRef(null);
  const waveSurfer = useRef(null);
  const prevActiveRegion = useRef(null);

  useEffect(() => {
    if (!waveSurfer.current) {
      const ws = WaveSurfer.create({
        container: containerSurf.current,
        waveColor: 'rgb(200, 0, 200)',
        progressColor: 'rgb(100, 0, 100)',
        url,
      });
      const wsRegions = ws.registerPlugin(RegionsPlugin.create());

      wsRegions.enableDragSelection({
        color: 'rgba(255, 0, 0, 0.1)',
      });

      wsRegions.on('region-updated', (region) => {
        console.log('Updated region', region);
      });

      let activeRegionTest = null;

      wsRegions.on('region-clicked', (region, e) => {
        e.stopPropagation();
        activeRegionTest = region;
        setActiveRegion(region);
      });

      wsRegions.on('region-out', (region) => {
        if (activeRegionTest === region) {
          waveSurfer.current.pause();
          setIsPlaying(false);
        }
      });

      ws.on('interaction', () => {
        setActiveRegion(null);
      });

      waveSurfer.current = ws;
    }

    return () => {
      waveSurfer.current.destroy();
    };
  }, [url]);

  useEffect(() => {
    if (prevActiveRegion.current !== activeRegion) {
      prevActiveRegion.current = activeRegion;
    }
  }, [activeRegion]);

  const handlePlayPause = () => {
    if (waveSurfer.current) {
      if (activeRegion) {
        activeRegion.play();
      } else {
        if (isPlaying) {
          waveSurfer.current.pause();
        } else {
          waveSurfer.current.play();
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <>
      <div ref={containerSurf} />
      <button onClick={handlePlayPause}>{isPlaying ? 'Pause' : 'Play'}</button>
      <p>Active Region: {activeRegion ? activeRegion.id : 'None'}</p>{' '}
    </>
  );
}

export default AudioMarkup;
