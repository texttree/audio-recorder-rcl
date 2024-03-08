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
  const insertSample = Math.floor(currentTime * mainAudio.sampleRate);

  // Prepare a new audio buffer that can contain the data from both buffers
  const newAudioLength = mainAudio.length + insertAudio.length;
  const newAudioBuffer = new AudioContext().createBuffer(
    mainAudio.numberOfChannels,
    newAudioLength,
    mainAudio.sampleRate
  );

  // Iterate over each channel
  for (let channel = 0; channel < mainAudio.numberOfChannels; channel++) {
    // Get the data for each buffer's channel
    const mainAudioData = mainAudio.getChannelData(channel);
    const insertAudioData = insertAudio.getChannelData(
      channel % insertAudio.numberOfChannels
    );

    // Calculate the insert positions for the channel data
    const mainAudioBeforeInsert = mainAudioData.subarray(0, insertSample);
    const mainAudioAfterInsert = mainAudioData.subarray(insertSample);

    // Create a new array for the combined audio data
    const newChannelData = newAudioBuffer.getChannelData(channel);

    // Combine the data into the new array
    newChannelData.set(mainAudioBeforeInsert, 0);
    newChannelData.set(insertAudioData, mainAudioBeforeInsert.length);
    newChannelData.set(
      mainAudioAfterInsert,
      mainAudioBeforeInsert.length + insertAudioData.length
    );
  }

  // The returned object should include the full buffer and the means to convert it to a wav if needed
  return {
    arrayBuffer: newAudioBuffer,
    // bufferToWave should be a function that can convert an AudioBuffer to a WAV file ArrayBuffer
    audio: bufferToWave(newAudioBuffer, 0, newAudioLength), // Assuming `bufferToWave` is defined
  };
}
