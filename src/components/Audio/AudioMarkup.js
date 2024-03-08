import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

function AudioMarkup({ url }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeRegion, setActiveRegion] = useState(null);
  const [regionsArray, setRegionsArray] = useState([]);
  const [forceUpdate, setForceUpdate] = useState(false);

  const containerSurf = useRef(null);
  const waveSurfer = useRef(null);
  const prevActiveRegion = useRef(null);
  const isMarkerModeEnabledRef = useRef(false);
  const wsRegions = useRef(null);

  useEffect(() => {
    if (!waveSurfer.current) {
      const ws = WaveSurfer.create({
        container: containerSurf.current,
        waveColor: 'rgb(200, 0, 200)',
        progressColor: 'rgb(100, 0, 100)',
        url,
      });

      const regions = RegionsPlugin.create();
      wsRegions.current = ws.registerPlugin(regions);

      wsRegions.current.enableDragSelection({
        color: 'rgba(255, 0, 0, 0.1)',
      });

      ws.on('click', () => {
        if (isMarkerModeEnabledRef.current) {
          const time = waveSurfer.current.getCurrentTime();
          wsRegions.current.addRegion({
            start: time,
            color: 'blue',
            draggable: false,
            resize: false,
            content: '✪',
          });
        }
      });

      wsRegions.current.on('region-click', (region) => {
        waveSurfer.current.seekTo(region.start);
      });

      wsRegions.current.on('region-updated', (region) => {
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

      wsRegions.current.on('region-created', (region) => {
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

      wsRegions.current.on('region-clicked', (region, e) => {
        e.stopPropagation();
        activeRegionTest = region;
        setActiveRegion(region);
        waveSurfer.current.seekTo(region.start / waveSurfer.current.getDuration());
      });

      wsRegions.current.on('region-out', (region) => {
        if (activeRegionTest === region) {
          waveSurfer.current.pause();
          setIsPlaying(false);
        }
      });

      ws.on('interaction', () => {
        setActiveRegion(null);
      });

      ws.on('finish', () => {
        setIsPlaying(false);
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
    setForceUpdate((prev) => !prev);
  };

  const handleGetRegions = () => {
    const filteredRegions = regionsArray.filter((region) => region.start !== region.end);
    const regionsString = JSON.stringify(filteredRegions);
    alert(regionsString);
  };

  const handleGetBookmarks = () => {
    const bookmarks = regionsArray.filter((region) => region.start === region.end);
    const bookmarksString = JSON.stringify(bookmarks);
    alert(bookmarksString);
  };

  const handleDeleteAllRegions = () => {
    if (wsRegions.current) {
      wsRegions.current.clearRegions();
      setRegionsArray([]);
    }
  };

  const handleDeleteRegion = () => {
    if (activeRegion) {
      activeRegion.remove();
      setRegionsArray(regionsArray.filter((region) => region.id !== activeRegion.id));
      setActiveRegion(null);
    }
  };

  return (
    <>
      <div ref={containerSurf} />
      <div style={{ paddingTop: '10px', display: 'flex', gap: '10px' }}>
        <button onClick={handlePlayPause}>{isPlaying ? 'Pause' : 'Play'}</button>
        <button onClick={handleMarkerModeToggle}>
          {isMarkerModeEnabledRef.current ? 'Disable Bookmark mode' : 'Bookmark'}
        </button>
        <button
          onClick={handleGetRegions}
          disabled={!regionsArray.some((region) => region.start !== region.end)}
        >
          Get Regions
        </button>
        <button
          onClick={handleGetBookmarks}
          disabled={!regionsArray.some((region) => region.start === region.end)}
        >
          Get Bookmarks
        </button>
        <button onClick={handleDeleteAllRegions} disabled={regionsArray.length === 0}>
          Delete All
        </button>
        <button onClick={handleDeleteRegion} disabled={!activeRegion}>
          {activeRegion && activeRegion.start === activeRegion.end
            ? 'Delete Bookmark'
            : 'Delete Region'}
        </button>
      </div>
      <p>Active Region: {activeRegion ? activeRegion.id : 'None'}</p>
    </>
  );
}

export default AudioMarkup;
