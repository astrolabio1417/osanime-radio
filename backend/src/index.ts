import express from 'express'
import cors from 'cors'
import path from 'path'
import proxyRoute from './routes/proxyRoute'
import streamRoute from './routes/streamRoute'
const app = express()
const PORT = process.env.PORT

app.use(express.json())
app.use(
  cors({
    origin: '*',
  }),
)

app.use('/stream', streamRoute)
app.use('/proxy', proxyRoute)
app.use(express.static(path.join(__dirname, 'public')))
app.get('/*', (_, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))

app.listen(PORT, () => {
  console.log(`App is listening to ${PORT}`)
})
