import {Router as router} from 'express';
import {OsAnimeRadio} from '../utils/express-radio';
import {InterfaceRadioPlaylistItem} from '../@types/express-radio';
import {InterfaceOsanimeItem} from '../@types/osanime';
import {v4 as uuidv4} from 'uuid';
import contentDisposition from 'content-disposition';
import {getAnimeSongs} from '../utils/osanime';
import songs from '../../public/songs.json';
import fs from 'fs';


const streamRoute = router();
const radio = new OsAnimeRadio();
radio.play();
radio.update(songs);


// eslint-disable-next-line require-jsdoc
async function updateRadio() {
  const osanimePlaylist: InterfaceOsanimeItem[] = await getAnimeSongs(100);
  const radioPlaylist: InterfaceRadioPlaylistItem[] = osanimePlaylist?.map(
      (item) => ({
        id: uuidv4(),
        title: item?.title,
        file: item?.url,
        image: item?.image,
      }),
  );
  fs.writeFileSync(`./public/songs.json`, JSON.stringify(radioPlaylist));
  radio.update(radioPlaylist);
  radio.shuffle();
}

streamRoute.get('/', (req, res) => {
  radio.addClient(res);
  req.on('close', () => radio.removeClient(res));
  res.setHeader('content-type', 'audio/mpeg');
});

streamRoute.get('/update-playlist', async (req, res) => {
  if (req.query?.pw !== process.env.PASSWORD) {
    return res.status(400).json({'message': 'wrong password!'});
  }
  await updateRadio();
  res.json({'message': `playlist updated! Total: ${radio.playlist.length}`});
});

streamRoute.get('/queue', (req, res) => {
  res.json({
    results: radio.playlist.slice(0, 50),
    priorities: radio.priorities,
    connected: radio.clients.length,
  });
});

streamRoute.post('/add-to-priority', (req, res) => {
  const result = radio.addToPriority(req.body?.id);

  if (result === -1 || result === -2) {
    res.status(400).json({
      message: result === -2 ? 'ID is in the priority lists.' : 'ID Not Found',
    });
  } else {
    res.json({
      result: result,
    });
  }
});

streamRoute.get('/search', (req, res) => {
  const query = req.query?.q?.toString();

  res.json({
    query: query,
    results: radio.searchByTitle(query),
  });
});

streamRoute.get('/:id', (req, res) => {
  res.json(radio.searchById(req.params.id));
});

streamRoute.get('/:id/download', async (req, res) => {
  const {result} = radio.searchById(req.params.id);

  if (!result) return res.status(400).json({message: 'ID not found!'});
  const reader = await radio.createReadStream(result);
  if (!reader) return res.status(400).json({message: 'file not found!'});
  res.setHeader('content-type', 'audio/mpeg');
  res.setHeader(
      'content-disposition',
      contentDisposition(`${result?.title}.mp3`),
  );
  reader?.pipe(res);
});


export default streamRoute;
