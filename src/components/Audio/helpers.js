export function bufferToWave(abuffer, offset = 0, len) {
  var numOfChan = abuffer.numberOfChannels,
    length = len * numOfChan * 2 + 44,
    buffer = new ArrayBuffer(length),
    view = new DataView(buffer),
    channels = [],
    i,
    sample,
    pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this demo)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true); // update data chunk
      pos += 2;
    }
    offset++; // next source sample
  }

  // create Blob
  return (URL || webkitURL).createObjectURL(new Blob([buffer], { type: 'audio/wav' }));

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

export const copy = (arrayBuffer, startSeconds, endSeconds) => {
  const sampleRate = arrayBuffer.sampleRate;
  const start = Math.floor(startSeconds * sampleRate);
  const end = Math.floor(endSeconds * sampleRate);
  const channels = [];
  for (let channel = 0; channel < arrayBuffer.numberOfChannels; channel++) {
    const channelData = arrayBuffer.getChannelData(channel);
    const slicedData = channelData.subarray(start, end);
    channels.push(slicedData);
  }
  const context = new AudioContext();
  const newAudioBuffer = context.createBuffer(
    arrayBuffer.numberOfChannels,
    end - start,
    arrayBuffer.sampleRate
  );
  for (let channel = 0; channel < arrayBuffer.numberOfChannels; channel++) {
    newAudioBuffer.copyToChannel(channels[channel], channel);
  }

  return {
    arrayBuffer: newAudioBuffer,
    audio: bufferToWave(newAudioBuffer, 0, newAudioBuffer.length),
  };
};

export const cut = (arrayBuffer, startSeconds, endSeconds) => {
  const sampleRate = arrayBuffer.sampleRate;
  const start = Math.floor(startSeconds * sampleRate);
  const end = Math.floor(endSeconds * sampleRate);
  const channels = [];
  const totalLength = arrayBuffer.length - (end - start);

  for (let channel = 0; channel < arrayBuffer.numberOfChannels; channel++) {
    const channelData = arrayBuffer.getChannelData(channel);
    const beforeCut = channelData.subarray(0, start);
    const afterCut = channelData.subarray(end);
    const combinedData = new Float32Array(beforeCut.length + afterCut.length);
    combinedData.set(beforeCut, 0);
    combinedData.set(afterCut, beforeCut.length);
    channels.push(combinedData);
  }

  const context = new AudioContext();
  const newAudioBuffer = context.createBuffer(
    arrayBuffer.numberOfChannels,
    totalLength,
    sampleRate
  );

  for (let channel = 0; channel < arrayBuffer.numberOfChannels; channel++) {
    newAudioBuffer.copyToChannel(channels[channel], channel);
  }

  return bufferToWave(newAudioBuffer, 0, newAudioBuffer.length);
};

export function insert(mainAudio, currentTime, insertAudio) {
  const insertTime = currentTime;
  const insertSample = Math.floor(insertTime * mainAudio.sampleRate);

  const mainAudioData = mainAudio.getChannelData(0);
  const insertAudioData = insertAudio.getChannelData(0);

  const mainAudioBeforeInsert = mainAudioData.subarray(0, insertSample);
  const mainAudioAfterInsert = mainAudioData.subarray(insertSample);

  const newAudioData = new Float32Array(
    mainAudioBeforeInsert.length + insertAudioData.length + mainAudioAfterInsert.length
  );
  newAudioData.set(mainAudioBeforeInsert, 0);
  newAudioData.set(insertAudioData, mainAudioBeforeInsert.length);
  newAudioData.set(
    mainAudioAfterInsert,
    mainAudioBeforeInsert.length + insertAudioData.length
  );

  const context = new AudioContext();
  const newAudioBuffer = context.createBuffer(
    mainAudio.numberOfChannels,
    newAudioData.length,
    mainAudio.sampleRate
  );

  newAudioBuffer.copyToChannel(newAudioData, 0);
  return {
    arrayBuffer: newAudioBuffer,
    audio: bufferToWave(newAudioBuffer, 0, newAudioBuffer.length),
  };
}
