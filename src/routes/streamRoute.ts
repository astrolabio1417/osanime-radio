import {Router as router} from 'express';
import {OsAnimeRadio} from '../utils/express-radio';
import {InterfaceRadioPlaylistItem} from '../@types/express-radio';
import {shuffle} from '../utils/shuffle';
import {InterfaceOsanimeItem} from '../@types/osanime';
import {v4 as uuidv4} from 'uuid';
import ost from '../../public/ost-music.json';
import contentDisposition from 'content-disposition';

const streamRoute = router();
const osanimePlaylist: InterfaceOsanimeItem[] = shuffle(
    ost?.filter((a) => a.image || a.url || a.title),
);
const radioPlaylist: InterfaceRadioPlaylistItem[] = osanimePlaylist?.map(
    (item) => ({
      id: uuidv4(),
      title: item?.title,
      file: item?.url,
      image: item?.image,
    }),
);

const radio = new OsAnimeRadio(radioPlaylist);
radio.play();

streamRoute.get('/', (req, res) => {
  radio.addClient(res);
  req.on('close', () => radio.removeClient(res));
  res.setHeader('content-type', 'audio/mpeg');
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

  if (result) {
    res.setHeader('content-type', 'audio/mpeg');
    res.setHeader(
        'content-disposition',
        contentDisposition(`${result?.title}.mp3`),
    );
    const reader = await radio.createReadStream(result);
    reader?.pipe(res);
  } else {
    res.status(400).json({message: 'ID not found'});
  }
});

export default streamRoute;
