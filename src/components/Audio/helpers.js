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

export function getWavBytes(buffer, options) {
  const type = options.isFloat ? Float32Array : Uint16Array;
  const numFrames = buffer.byteLength / type.BYTES_PER_ELEMENT;

  const headerBytes = getWavHeader(Object.assign({}, options, { numFrames }));
  const wavBytes = new Uint8Array(headerBytes.length + buffer.byteLength);

  // prepend header, then add pcmBytes
  wavBytes.set(headerBytes, 0);
  wavBytes.set(new Uint8Array(buffer), headerBytes.length);

  return wavBytes;
}

export function getWavHeader(options) {
  const numFrames = options.numFrames;
  const numChannels = options.numChannels || 2;
  const sampleRate = options.sampleRate || 44100;
  const bytesPerSample = options.isFloat ? 4 : 2;
  const format = options.isFloat ? 3 : 1;

  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;

  const buffer = new ArrayBuffer(44);
  const dv = new DataView(buffer);

  let p = 0;

  function writeString(s) {
    for (let i = 0; i < s.length; i++) {
      dv.setUint8(p + i, s.charCodeAt(i));
    }
    p += s.length;
  }

  function writeUint32(d) {
    dv.setUint32(p, d, true);
    p += 4;
  }

  function writeUint16(d) {
    dv.setUint16(p, d, true);
    p += 2;
  }

  writeString('RIFF'); // ChunkID
  writeUint32(dataSize + 36); // ChunkSize
  writeString('WAVE'); // Format
  writeString('fmt '); // Subchunk1ID
  writeUint32(16); // Subchunk1Size
  writeUint16(format); // AudioFormat https://i.stack.imgur.com/BuSmb.png
  writeUint16(numChannels); // NumChannels
  writeUint32(sampleRate); // SampleRate
  writeUint32(byteRate); // ByteRate
  writeUint16(blockAlign); // BlockAlign
  writeUint16(bytesPerSample * 8); // BitsPerSample
  writeString('data'); // Subchunk2ID
  writeUint32(dataSize); // Subchunk2Size

  return new Uint8Array(buffer);
}

export const copy = (arrayBuffer, startSeconds, endSeconds) => {
  const sampleRate = arrayBuffer.sampleRate;
  const start = Math.floor(startSeconds * sampleRate);
  const end = Math.floor(endSeconds * sampleRate);
  const channels = [];
  for (let channel = 0; channel < arrayBuffer.numberOfChannels; channel++) {
    const channelData = arrayBuffer.getChannelData(channel);
    const slicedData = channelData.subarray(start, end); // Вырезаем кусок данных
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

  return bufferToWave(newAudioBuffer, 0, newAudioBuffer.length);
};

export const cut = (arrayBuffer, startSeconds, endSeconds) => {
  const sampleRate = arrayBuffer.sampleRate;
  const start = Math.floor(startSeconds * sampleRate);
  const end = Math.floor(endSeconds * sampleRate);
  const channels = [];
  const totalLength = arrayBuffer.length - (end - start);

  for (let channel = 0; channel < arrayBuffer.numberOfChannels; channel++) {
    const channelData = arrayBuffer.getChannelData(channel);
    const beforeCut = channelData.subarray(0, start); // Данные до начала отрезка
    const afterCut = channelData.subarray(end); // Данные после конца отрезка
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
