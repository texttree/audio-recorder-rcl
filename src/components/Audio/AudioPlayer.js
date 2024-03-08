import React, { useRef, useEffect, useImperativeHandle } from 'react';
import WaveSurfer from 'wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import Regions from 'wavesurfer.js/dist/plugins/regions.esm.js';

const AudioPlayer = React.forwardRef(
  ({ url, timelinePlugin = {}, wavesurferProps }, ref) => {
    const containerRef = useRef();
    const wavesurfer = useRef(null);

    useEffect(() => {
      const plugins = [];
      if (Object.keys(timelinePlugin)?.length) {
        plugins.push(
          TimelinePlugin.create({
            container: containerRef.current,
            ...timelinePlugin,
          })
        );
      }

      plugins.push(Regions.create());

      wavesurfer.current = WaveSurfer.create({
        container: containerRef.current,
        dragToSeek: true,
        enableDragSelection: true,
        plugins,
        ...wavesurferProps,
      });

      wavesurfer.current.load(url);

      return () => {
        wavesurfer.current.destroy();
      };
    }, [url, timelinePlugin]);

    const onPlayPause = () => {
      wavesurfer.current.playPause();
    };

    useImperativeHandle(ref, () => ({
      onPlayPause: onPlayPause,
    }));

    return <div ref={containerRef} />;
  }
);

export default AudioPlayer;
AudioPlayer.displayName = 'AudioPlayer';
