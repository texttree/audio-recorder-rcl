import React, { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';

const AudioRecorder = () => {
  const waveformRef = useRef(null);
  const recordingsRef = useRef(null);
  const progressRef = useRef(null);
  const [time, setTime] = useState('00:00');
  const [wavesurfer, setWaveSurfer] = useState(null);
  const [record, setRecord] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPausedRecording, setIsPausedRecording] = useState(false);

  const handlePause = () => {
    if (record.isPaused()) {
      record.resumeRecording();
      setIsPausedRecording(false);
    } else {
      record.pauseRecording();
      setIsPausedRecording(true);
    }
  };

  const handleRecord = () => {
    if (record.isRecording() || isPausedRecording) {
      record.stopRecording();
      setIsRecording(false);
      setIsPausedRecording(false);
    } else {
      setIsRecording(true);
      setIsPausedRecording(false);
      record.startRecording({}).then(() => {
        setIsRecording(false);
        setIsPausedRecording(true);
      });
    }
  };

  useEffect(() => {
    const createWaveSurfer = () => {
      if (wavesurfer) {
        wavesurfer.destroy();
      }
      const newWaveSurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'rgb(200, 0, 200)',
        progressColor: 'rgb(100, 0, 100)',
        plugins: [
          TimelinePlugin.create({
            container: waveformRef?.current,
            primaryLabelFontColor: '#000',
            timeInterval: 5,
            height: 20,
          }),
        ],
      });

      const newRecord = newWaveSurfer.registerPlugin(
        RecordPlugin.create({ scrollingWaveform: true, renderRecordedAudio: true })
      );

      newRecord.on('record-end', (blob) => {
        const container = recordingsRef.current;
        const recordedUrl = URL.createObjectURL(blob);

        const newWaveSurfer = WaveSurfer.create({
          container,
          waveColor: 'rgb(200, 100, 0)',
          progressColor: 'rgb(100, 50, 0)',
          url: recordedUrl,
        });

        const button = document.createElement('button');
        button.textContent = 'Play';
        button.onclick = () => newWaveSurfer.playPause();
        newWaveSurfer.on('pause', () => (button.textContent = 'Play'));
        newWaveSurfer.on('play', () => (button.textContent = 'Pause'));
        container.appendChild(button);
        const link = document.createElement('a');
        Object.assign(link, {
          href: recordedUrl,
          download: 'recording.mp3',
          textContent: 'Download recording',
        });
        container.appendChild(link);
      });
      newRecord.on('record-progress', (time) => {
        updateProgress(time);
      });
      setWaveSurfer(newWaveSurfer);
      setRecord(newRecord);
    };

    createWaveSurfer();

    return () => {
      if (wavesurfer) {
        wavesurfer.destroy();
      }
    };
  }, []);

  const updateProgress = (time) => {
    const formattedTime = [
      Math.floor((time % 3600000) / 60000), // minutes
      Math.floor((time % 60000) / 1000), // seconds
    ]
      .map((v) => (v < 10 ? '0' + v : v))
      .join(':');
    setTime(formattedTime);
  };

  return (
    <div>
      <button id="record" onClick={handleRecord}>
        {isRecording || isPausedRecording ? 'Stop' : 'Record'}
      </button>
      <button
        id="pause"
        style={{ display: isRecording || isPausedRecording ? 'inline' : 'none' }}
        onClick={handlePause}
      >
        {isPausedRecording ? 'Resume' : 'Pause'}
      </button>
      <p ref={progressRef}>{time}</p>
      <div
        ref={waveformRef}
        style={{
          border: '1px solid #ddd',
          borderRadius: '4px',
          marginTop: '1rem',
          overflow: 'auto',
        }}
      ></div>
      <div ref={recordingsRef} style={{ margin: '1rem 0' }}></div>
    </div>
  );
};
export default AudioRecorder;
