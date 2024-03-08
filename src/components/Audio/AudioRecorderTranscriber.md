### Transcribe

Во время записи в режиме реального времени показывает текст

Для распознования текста в режиме реального времени используется библиотека Vosk(https://github.com/alphacep/vosk-api). Она поддерживает более 20 языков: English, Indian English, German, French, Spanish, Portuguese, Chinese, Russian, Turkish, Vietnamese, Italian, Dutch, Catalan, Arabic, Greek, Farsi, Filipino, Ukrainian, Kazakh, Swedish, Japanese, Esperanto, Hindi, Czech, Polish. Работает оффлайн, так же работает в браузере, через wasm. Языковые модели около 50Мб, реализована на Python, Java, Node.JS, C#, C++, Rust, Go and других языках.

В этом примере мы запускаем запись звука (настроена модель англ языка сейчас, 116 строка), во время того как мы говорим, он распознает текст. После этого мы нажимаем стоп. Теперь каждое слово - это временная метка. Кликая по слову мы переходим к нужному моменту в аудио. Слова могут быть серыми - это значит что коэффициент точности ниже 70%.

Так же мы хотим реализовать следующие функции:

- распознование уже записанных аудио
- полная синхронизация с текстом, перемотка, прослушивание, метки
- возможность отредактировать распознанный текст
- экспорт текста в метаданные mp3 файла
- выбор языка распознавания

```jsx
import React from 'react';

import { AudioRecorderTranscriber } from '@texttree/audio-recorder-rcl';
import audioFile from '../../../examples/audiorecorder.mp3';

<div>
  <AudioRecorderTranscriber />
</div>;
```
