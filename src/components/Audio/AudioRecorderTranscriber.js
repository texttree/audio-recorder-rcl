import React, { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import VoiceToText from '@texttree/voice2text';

const AudioRecorderTranscriber = () => {
  const v2t = useRef();
  const waveformRef = useRef(null);
  const recordingRef = useRef(null);
  const progressRef = useRef(null);
  const [time, setTime] = useState('00:00');
  const [isDisabled, setIsDisabled] = useState(true);
  const [transcribedText, setTranscribedText] = useState([]);
  const [tempTranscribedText, setTempTranscribedText] = useState('');
  const [wavesurfer, setWaveSurfer] = useState(null);
  const resultWavesurfer = useRef(null);
  const [record, setRecord] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPausedRecording, setIsPausedRecording] = useState(false);

  const handlePause = () => {
    if (record.isPaused()) {
      record.resumeRecording();
      v2t.current.start();
      setIsPausedRecording(false);
    } else {
      record.pauseRecording();
      v2t.current.pause();
      setIsPausedRecording(true);
    }
  };

  const handleRecord = () => {
    if (record.isRecording() || isPausedRecording) {
      v2t.current.pause();
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
      v2t.current.start();
    }
  };

  useEffect(() => {
    const createWaveSurfer = () => {
      if (wavesurfer) {
        wavesurfer.destroy();
      }
      const newRecordWaveSurfer = WaveSurfer.create({
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

      const newRecord = newRecordWaveSurfer.registerPlugin(
        RecordPlugin.create({ scrollingWaveform: true, renderRecordedAudio: true })
      );

      newRecord.on('record-end', (blob) => {
        if (resultWavesurfer?.current) {
          resultWavesurfer.current.destroy();
        }
        const container = recordingRef.current;
        container.innerHTML = '';
        const recordedUrl = URL.createObjectURL(blob);

        resultWavesurfer.current = WaveSurfer.create({
          container,
          waveColor: 'rgb(200, 100, 0)',
          progressColor: 'rgb(100, 50, 0)',
          url: recordedUrl,
          interact: true,
          dragToSeek: true,
        });

        const button = document.createElement('button');
        button.textContent = 'Play';
        button.onclick = () => resultWavesurfer.current.playPause();
        resultWavesurfer.current.on('pause', () => (button.textContent = 'Play'));
        resultWavesurfer.current.on('play', () => (button.textContent = 'Pause'));
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
      setWaveSurfer(newRecordWaveSurfer);
      setRecord(newRecord);
    };

    createWaveSurfer();

    const voice2text = new VoiceToText({
      converter: 'vosk',
      language: 'en', // The language of the speech
    });
    // Start the speech recognition
    voice2text.init();
    v2t.current = voice2text;
    // Listen to the result event
    const parseEvent = (e) => {
      console.log(e.detail);
      switch (e.detail.type) {
        case 'PARTIAL':
          setTempTranscribedText(e.detail.text);
          break;
        case 'STATUS':
          setIsDisabled(e.detail.text === 'LOADED' ? false : e.detail.text === 'LOADING');
          break;
        case 'FINAL':
          setTempTranscribedText('');
          setTranscribedText((prev) => prev.concat(e.detail.result));
          break;
        default:
          break;
      }
    };
    window.addEventListener('voice', parseEvent);

    return () => {
      if (wavesurfer) {
        wavesurfer.destroy();
      }
      window.removeEventListener('voice', parseEvent);
    };
  }, []);

  const setResultTime = (time) => {
    console.log(time, resultWavesurfer);
    if (resultWavesurfer.current) {
      resultWavesurfer.current.setTime(time);
    }
  };

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
      <button id="record" onClick={handleRecord} disabled={isDisabled}>
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
      <div>
        <TranscribeBlock transcribedText={transcribedText} setTime={setResultTime} />{' '}
        {tempTranscribedText}
      </div>
      <div ref={recordingRef} style={{ margin: '1rem 0' }}></div>
    </div>
  );
};

const TranscribeBlock = ({ transcribedText, setTime }) => (
  <div
    style={{
      border: '1px solid #ddd',
      borderRadius: '4px',
      marginTop: '1rem',
      overflow: 'auto',
    }}
  >
    <span>
      {transcribedText.map((word, idx) => (
        <Word
          key={idx}
          word={word.word}
          conf={word.conf}
          start={word.start}
          end={word.end}
          onClick={() => setTime(word.start)}
        />
      ))}
    </span>
  </div>
);

const Word = ({ conf, end, start, word, onClick }) => (
  <span style={{ color: conf < 0.7 ? '#999' : '#000' }} title={conf} onClick={onClick}>
    {word}{' '}
  </span>
);

export default AudioRecorderTranscriber;
