import { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

const useWaveSurfer = (url, plugins = [], wavesurferProps) => {
  const waveformRef = useRef(null);
  const [waveSurferInstance, setWaveSurferInstance] = useState(null);

  useEffect(() => {
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      // waveColor: 'green',
      // progressColor: 'purple',
      // cursorColor: 'navy',
      url,
      plugins,
    });

    setWaveSurferInstance(wavesurfer);

    return () => {
      wavesurfer.destroy();
    };
  }, [url, plugins]);

  return [waveformRef, waveSurferInstance];
};

export default useWaveSurfer;
