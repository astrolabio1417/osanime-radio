import {Router as router} from 'express';
import fetch, {Headers} from 'node-fetch';

const proxyRoute = router();

proxyRoute.get('/img', async (req, res) => {
  const url = req.query?.url?.toString();

  if (!url) return res.json({'message': 'missing url query'});
  const response = await fetch(url, {
    headers: new Headers({
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' +
      ' AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
      'referer': url,
    }),
  }).catch((e) => console.error(e));
  if (!response) return res.json({'message': 'fetch error!'});
  res.setHeader('content-type', response.headers.get('content-type') ?? '');
  res.setHeader('content-length', response.headers.get('content-length') ?? '');
  response.body.pipe(res);
});


export default proxyRoute;
