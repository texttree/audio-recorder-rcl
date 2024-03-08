### Default example

```jsx
import React, { useState } from 'react';

import { AudioEditor } from '@texttree/audio-recorder-rcl';
import audioFile from '../../../examples/audiorecorder.mp3';

function Component() {
  const [audioUrl, setAudioUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
  };

  return (
    <div>
      <AudioEditor url={audioUrl} />
      <label htmlFor="fileInput" style={{ cursor: 'pointer' }}>
        Choose file
      </label>
      <input
        id="fileInput"
        type="file"
        onChange={handleFileChange}
        accept="audio/*"
        style={{ display: 'none' }}
      />
    </div>
  );
}

<Component />;
```
