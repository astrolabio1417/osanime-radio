/* eslint-disable require-jsdoc */
let waiting = false;
musicQueue();
setInterval(musicQueue, 5000);
const audio = document.getElementById('audio');
const playButton = document.getElementById('play-pause');
const playButtonSvg = document.getElementById('play-pause-svg');
const volUpButton = document.getElementById('volume-up');
const volDownButton = document.getElementById('volume-down');
const priorityInput = document.getElementById('priority-input');
const musicsContainer = document.getElementById('musics');
const searchContainer = document.getElementById('search-container');
const searchInput = document.getElementById('search-input');


function createList(list, priorities) {
  return list.map((m, index) => {
    const divElement = document.createElement('div');
    const downloadElement = document.createElement('button');
    const downloadLinkElement = document.createElement('a');
    const titleElement = document.createElement('span');
    const buttonsElement = document.createElement('div');

    buttonsElement.className = 'music-button-container';

    titleElement.innerHTML = `${m?.title}`;
    divElement.className = 'music-item';
    divElement.appendChild(titleElement);

    downloadLinkElement.innerHTML = 'Download';
    downloadLinkElement.href = `/stream/${m?.id}/download`;
    downloadLinkElement.target = '_blank';

    downloadElement.className = 'music-item-button';
    downloadElement.appendChild(downloadLinkElement);
    buttonsElement.appendChild(downloadElement);

    if (index > priorities) {
      const priorityElement = document.createElement('button');
      priorityElement.className = 'music-item-button';
      priorityElement.innerHTML = 'Add to priority';
      priorityElement.onclick = () => {
        priorityInput.value = m?.id;
        onAddToPriority();
      };
      buttonsElement.appendChild(priorityElement);
    }

    divElement.appendChild(buttonsElement);
    return divElement;
  });
}

async function musicQueue() {
  if (waiting) return;
  waiting = true;
  const res = await fetch('/stream/queue').catch((e) => {
    console.error(e); return null;
  });
  if (!res?.ok) return (waiting = false);
  const {priorities, connected, results} = await res.json() || {};
  if (!results) return (waiting = false);
  const current = results[0];
  const currentDiv = document.getElementById('player-header');
  currentDiv.innerHTML = '';
  const title = document.createElement('h1');
  const connectedElement = document.createElement('span');
  const prioritiesElement = document.createElement('span');
  title.innerHTML = `${current?.title}`;
  connectedElement.innerHTML = `Connected: ${connected} <br>`;
  prioritiesElement.innerHTML = `Priorities: ${priorities + 1}`;
  currentDiv.appendChild(title);
  musicsContainer.innerHTML = '';
  createList(results, priorities)?.map((e) => musicsContainer.appendChild(e));
  waiting = false;
}

async function inputKeyup(e) {
  if (searchInput?.value?.length === 0) {
    return (searchContainer.innerHTML = '');
  }
  if (e.key !== 'Enter' || !searchInput?.value) return;
  console.log('searching...');
  searchContainer.innerHTML = '';
  const res = await fetch(`/stream/search?q=${searchInput?.value}`);
  if (!res.ok) return;
  const {results} = await res.json();
  createList(results, -1)?.map((e) => searchContainer.appendChild(e));
  searchInput.focus();
}

async function onAddToPriority() {
  console.log('add to priority');
  if (!priorityInput.value) return;

  const res = await fetch('/stream/add-to-priority', {
    method: 'post',
    headers: new Headers({
      'content-type': 'application/json',
    }),
    body: JSON.stringify({
      id: priorityInput.value,
    }),
  });
  const body = await res.json();
  console.log(body);
}

function onVolumeSet(set) {
  const volume = audio.volume;

  if (set == 1) {
    const newVol = volume + 0.1;
    audio.volume = newVol >= 1.0 ? 1.0 : newVol;
  } else {
    const newVol = volume - 0.2;
    audio.volume = newVol <= 0.0 ? 0.0 : newVol;
  }
}

function reloadPlayer() {
  console.log('audio error! reloading...');
  audio.src = '';
  audio.src = '/stream';
  audio.load();
  audio.play();
}

playButton.addEventListener('click', () => {
  if (!audio.paused) return audio.pause();
  audio.src = '/stream';
  audio.play();
  return;
});
volUpButton.addEventListener('click', () => onVolumeSet(1));
volDownButton.addEventListener('click', () => onVolumeSet(0));
audio.addEventListener('error', () => {
  console.log('audio error...');
  reloadPlayer();
});
audio.addEventListener('ended', () => {
  console.log('audio ended...');
  reloadPlayer();
});
audio.addEventListener('playing', () => (playButtonSvg.src = '/svg/pause.svg'));
audio.addEventListener('pause', () => (playButtonSvg.src = '/svg/play.svg'));
audio.addEventListener(
    'waiting',
    () => (playButtonSvg.src = '/svg/loading.svg'),
);

searchInput.addEventListener('keyup', inputKeyup);
