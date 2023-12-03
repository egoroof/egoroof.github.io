import { ID3Writer } from './browser-id3-writer.6.0.0.mjs';

streamSaver.mitm = 'https://egoroof.github.io/browser-id3-writer/mitm.html?v=1';

const getElem = document.getElementById.bind(document);
const submit = getElem('submit');

if (!streamSaver.supported) {
  submit.disabled = 'disabled';
  submit.innerText =
    'Your browser does not support Streams or Service Worker :(';
  submit.classList.remove('btn-primary');
  submit.classList.add('btn-danger');
}

function loadFile(file, onSuccess) {
  const reader = new FileReader();
  reader.onload = function () {
    onSuccess(reader.result);
  };
  reader.onerror = function () {
    console.error('Reader error', reader.error);
  };
  reader.readAsArrayBuffer(file);
}

function getId3Buffer(picArrayBuffer) {
  const writer = new ID3Writer(new ArrayBuffer(0));
  const simpleFrames = [
    'TIT2',
    'TALB',
    'TPE2',
    'TRCK',
    'TPOS',
    'TYER',
    'USLT',
    'TPUB',
  ];
  const splittableFrames = ['TPE1', 'TCOM', 'TCON'];

  simpleFrames.forEach(function (frame) {
    if (getElem(frame).value) {
      if (frame === 'USLT') {
        writer.setFrame('USLT', {
          description: '',
          lyrics: getElem(frame).value,
        });
      } else {
        writer.setFrame(frame, getElem(frame).value);
      }
    }
  });
  splittableFrames.forEach(function (frame) {
    if (getElem(frame).value) {
      writer.setFrame(frame, getElem(frame).value.split(';'));
    }
  });

  if (picArrayBuffer) {
    writer.setFrame('APIC', {
      type: 3,
      data: picArrayBuffer,
      description: '',
    });
  }

  writer.addTag();
  return writer.arrayBuffer;
}

function download(url, id3Buffer, filename) {
  const id3Tag = new Uint8Array(id3Buffer);

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        submit.innerText = 'HTTP status error';
        return;
      }
      let fileStream;
      const songSize = response.headers.get('Content-Length');
      if (songSize) {
        fileStream = streamSaver.createWriteStream(filename, {
          size: Number(songSize) + id3Tag.byteLength,
        });
      } else {
        fileStream = streamSaver.createWriteStream(filename);
      }
      const writer = fileStream.getWriter();
      const reader = response.body.getReader();
      let readByteCount = 0;

      // push id3 tag first
      writer
        .write(id3Tag)
        .then(pump)
        .then(() => {
          submit.innerText = 'All done';
          setTimeout(() => {
            submit.innerText = 'Add tag on the fly';
            submit.disabled = '';
          }, 4000);
        });

      function pump() {
        return reader.read().then((result) => {
          if (result.done) {
            return writer.close();
          } else {
            readByteCount += result.value.length;
            if (songSize) {
              submit.innerText = `Downloaded ${Math.ceil(
                (readByteCount / songSize) * 100
              )} %...`;
            } else {
              submit.innerText = 'Downloading...';
            }
            return writer.write(result.value).then(pump);
          }
        });
      }
    })
    .catch((e) => (submit.innerText = e.message));
}

getElem('form').addEventListener('submit', function (e) {
  e.preventDefault();

  const url = getElem('songUrl').value;
  const filename = getElem('songFilename').value;
  submit.disabled = 'disabled';
  submit.innerText = 'Fetching...';

  if (getElem('APIC').files.length > 0) {
    loadFile(getElem('APIC').files[0], (picArrayBuffer) => {
      const id3Tag = getId3Buffer(picArrayBuffer);
      download(url, id3Tag, filename);
    });
  } else {
    const id3Tag = getId3Buffer();
    download(url, id3Tag, filename);
  }
});

getElem('tabsControl').addEventListener('click', function (e) {
  e.preventDefault();

  if (!e.target.hash) {
    return;
  }

  const menuLinks = this.querySelectorAll('li > a');
  for (let i = 0; i < menuLinks.length; i++) {
    const menuElem = menuLinks[i];
    menuElem.classList.remove('active');
  }

  e.target.classList.add('active');

  if (e.target.hash === '#main') {
    getElem('tabMain').classList.remove('d-none');
    getElem('tabAlbum').classList.add('d-none');
    getElem('tabOther').classList.add('d-none');
  } else if (e.target.hash === '#album') {
    getElem('tabMain').classList.add('d-none');
    getElem('tabAlbum').classList.remove('d-none');
    getElem('tabOther').classList.add('d-none');
  } else if (e.target.hash === '#other') {
    getElem('tabMain').classList.add('d-none');
    getElem('tabAlbum').classList.add('d-none');
    getElem('tabOther').classList.remove('d-none');
  }
});
