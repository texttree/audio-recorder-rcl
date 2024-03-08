### Default example

```jsx
import React, { useRef } from 'react';

import { AudioPlayer } from '@texttree/audio-recorder-rcl';
import audioFile from '../../../examples/audiorecorder.mp3';

function Component() {
  const timelinePlugin = { primaryLabelFontColor: '#000', timeInterval: 5, height: 20 };
  const audioPlayerRef = useRef();

  const handlePlayPause = () => {
    audioPlayerRef.current.onPlayPause();
  };
  const wavesurferProps = { waveColor: 'green' };
  return (
    <div>
      <AudioPlayer
        url={audioFile}
        timelinePlugin={timelinePlugin}
        ref={audioPlayerRef}
        wavesurferProps={wavesurferProps}
      />
      <button onClick={handlePlayPause}>Play/Pause</button>
    </div>
  );
}

<Component />;
```
