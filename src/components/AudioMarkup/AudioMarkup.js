import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

function AudioMarkup({ url }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeRegion, setActiveRegion] = useState(null);
  const [regionsArray, setRegionsArray] = useState([]);

  const containerSurf = useRef(null);
  const waveSurfer = useRef(null);
  const prevActiveRegion = useRef(null);
  const isMarkerModeEnabledRef = useRef(false);

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

      ws.on('click', () => {
        if (isMarkerModeEnabledRef.current) {
          const time = waveSurfer.current.getCurrentTime();
          wsRegions.addRegion({
            start: time,
            color: 'blue',
            draggable: false,
            resize: false,
            content: '✪',
          });
        }
      });

      wsRegions.on('region-click', (region) => {
        waveSurfer.current.seekTo(region.start);
      });

      wsRegions.on('region-updated', (region) => {
        setRegionsArray((prevRegionsArray) => {
          const updatedRegionsArray = prevRegionsArray.map((regionData) => {
            if (regionData.id === region.id) {
              return {
                ...regionData,
                start: Math.round(region.start * 100) / 100,
                end: Math.round(region.end * 100) / 100,
              };
            }
            return regionData;
          });

          updatedRegionsArray.sort((a, b) => a.start - b.start);
          console.log('updatedRegionsArray', updatedRegionsArray);
          return updatedRegionsArray;
        });
      });

      wsRegions.on('region-created', (region) => {
        const startInSeconds = Math.round(region.start * 100) / 100;
        const endInSeconds = Math.round(region.end * 100) / 100;
        const newRegion = {
          start: startInSeconds,
          end: endInSeconds,
          id: region.id,
        };

        setRegionsArray((prevRegionsArray) => {
          const updatedRegionsArray = [...prevRegionsArray, newRegion];
          updatedRegionsArray.sort((a, b) => a.start - b.start);
          console.log('updatedRegionsArray', updatedRegionsArray);
          return updatedRegionsArray;
        });
      });

      let activeRegionTest = null;

      wsRegions.on('region-clicked', (region, e) => {
        e.stopPropagation();
        activeRegionTest = region;
        setActiveRegion(region);
        waveSurfer.current.seekTo(region.start / waveSurfer.current.getDuration());
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

  const handleMarkerModeToggle = () => {
    isMarkerModeEnabledRef.current = !isMarkerModeEnabledRef.current;
  };

  return (
    <>
      <div ref={containerSurf} />
      <button onClick={handlePlayPause}>{isPlaying ? 'Pause' : 'Play'}</button>
      <button onClick={handleMarkerModeToggle}>
        {isMarkerModeEnabledRef.current ? 'Отключить режим маркеров' : 'Маркер'}
      </button>
      <p>Active Region: {activeRegion ? activeRegion.id : 'None'}</p>
    </>
  );
}

export default AudioMarkup;
