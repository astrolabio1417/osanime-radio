import express from 'express';
import path from 'path';
import proxyRoute from './src/routes/proxyRoute';
import streamRoute from './src/routes/streamRoute';
const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(express.static(path.join(__dirname, './public')));
app.use(express.static(path.join(__dirname, './views')));
app.get('/', (req, res) => res.render('index.html'));
app.use('/stream', streamRoute);
app.use('/proxy', proxyRoute);

app.listen(PORT, () => {
  console.log(`App is listening to ${PORT}`);
});
