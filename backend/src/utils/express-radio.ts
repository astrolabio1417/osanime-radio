import fetch, { Headers } from 'node-fetch'
import Express from 'express'
import fs from 'fs'
import { ffprobe } from '@dropb/ffprobe'
import Throttle from 'throttle'
import { OsAnime } from './osanime'
import { InterfaceRadioPlaylistItem } from '../@types/express-radio'
import { shuffle } from './shuffle'

/**
 *  Class to create Radio
 */
class ExpressRadio {
  playlist: InterfaceRadioPlaylistItem[]
  defaultHeaders: Headers
  errors: number
  max_errors: number
  clients: Express.Response[]
  priorities: number

  /**
   * @param {InterfaceRadioPlaylistItem[]} playlist - list of musics
   */
  constructor(playlist: InterfaceRadioPlaylistItem[] = []) {
    this.playlist = playlist
    this.defaultHeaders = new Headers({
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' +
        ' (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
      Connection: 'keep-alive',
      'Accept-Ranges': 'bytes',
    })
    this.errors = 0
    this.max_errors = 2
    this.clients = []
    this.priorities = 0
  }

  /**
   * shuffle the playlist
   */
  shuffle() {
    this.playlist = shuffle(this.playlist)
  }

  /**
   * @param {Object[]} playlist - list of musics
   */
  update(playlist: InterfaceRadioPlaylistItem[] = []) {
    this.playlist = playlist
  }

  /**
   * @param {InterfaceRadioPlaylistItem} item - {InterfaceRadioPlaylistItem}
   * @return {string | null} - return item filename or null
   */
  add(item: InterfaceRadioPlaylistItem): string | null {
    if (item?.file) return null
    this.playlist.push(item)
    return item.file
  }

  /**
   * @param {InterfaceRadioPlaylistItem} item - item of playlist
   * @param {string} filename - filename of playlist
   * @return {boolean | undefined} - condition for deletion
   */
  remove(item: InterfaceRadioPlaylistItem, filename?: string): boolean {
    const selected = this.playlist.findIndex((i) => i == item || i.file == filename)
    return selected == -1 ? false : !!this.playlist.splice(selected, 1)
  }

  /**
   * @param {string} id - id of item in playlist
   * @return {Object} - return item and index
   */
  searchById(id: string): {
    result: InterfaceRadioPlaylistItem | null
    index: number
  } {
    const searchIndex = this.playlist.findIndex((item) => item?.id === id)
    return {
      result: searchIndex === -1 ? null : this.playlist[searchIndex],
      index: searchIndex,
    }
  }

  /**
   * @param {string} q - filename or title of the item in playlist
   * @return {InterfaceRadioPlaylistItem[]} - list of query
   */
  searchByTitle(q = ''): InterfaceRadioPlaylistItem[] {
    return this.playlist.filter((item) => {
      const title = item?.title?.toLowerCase()
      const query = q?.toLowerCase()
      return title.includes(query) || title.includes(query)
    })
  }

  /**
   * @param {string} id - yeet
   * @return {number | InterfaceRadioPlaylistItem} item of playlist or boolean
   * -1 = Not Found
   * -2 = Priority item
   */
  addToPriority(
    id: string,
  ): InterfaceRadioPlaylistItem | 'not_found' | 'in_priority_list' {
    const { index } = this.searchById(id)
    if (index === -1) return 'not_found'
    if (index <= this.priorities) return 'in_priority_list'
    const item = this.playlist.splice(index, 1)
    this.priorities++
    item[0].priority = true
    this.playlist.splice(this.priorities, 0, item[0])
    return item[0]
  }

  /**
   * @param {InterfaceRadioPlaylistItem} item - item of playlist
   * @return {Promise<NodeJS.ReadableStream | null>} return readableStream
   * or null for invalid file
   */
  async createReadStream(
    src: string,
    headers?: Headers,
  ): Promise<{
    stream: NodeJS.ReadableStream
    size: number
    range?: string
  } | null> {
    const isHttp = src.startsWith('http')

    if (!isHttp) {
      if (!fs.existsSync(src)) return null
      return {
        stream: fs.createReadStream(src),
        size: (await fs.promises.stat(src)).size,
      }
    }

    const itemHeaders: Headers = this.defaultHeaders
    headers?.forEach((value, name) => itemHeaders.set(name, value))
    const response = await fetch(src, {
      headers: itemHeaders,
    })
    const length = response.headers.get('Content-Length')

    return {
      stream: response.body,
      range: response.headers.get('content-range') ?? '',
      size: length ? +length : 0,
    }
  }

  /**
   * move one item from top to bottom
   * return void
   */
  playlistRotate() {
    this.priorities && this.priorities--
    const current = this.playlist.shift()
    current?.priority && (current.priority = false)
    current && this.playlist.splice(this.playlist.length - 1, 0, current)
  }

  /**
   * Add express response to the list of clients
   * @param {Express.Response} response - Express Response
   */
  addClient(response: Express.Response) {
    this.clients.push(response)
  }

  /**
   * Remove express response to the list of clients
   * @param {Express.Response} response - Express response
   */
  removeClient(response: Express.Response): void {
    const clientIdex = this.clients.findIndex((res) => res === response)
    if (clientIdex === -1) return
    console.log(`Client ${clientIdex} has been disconnected!`)
    this.clients.splice(clientIdex, 1)
  }

  // eslint-disable-next-line require-jsdoc
  async getFfprobe(file: string) {
    const ffprobeData = await ffprobe(file).catch((e) => {
      console.error(e, 'ffprobe error')
    })
    if (!ffprobeData) return null

    return {
      bitRate: ffprobeData.format.bit_rate,
      duration: ffprobeData.format.duration,
    }
  }

  /**
   * play/loop playlist
   */
  async play(): Promise<void> {
    if (this.playlist.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return await this.play()
    }
    const selected = this.playlist[0]
    selected.priority = true
    console.log(selected?.file)
    const readStream = await this.createReadStream(selected.file).catch((e) => {
      console.error(e, 'readstream error')
      return null
    })
    const { duration, bitRate } = (await this.getFfprobe(selected.file)) || {}
    console.log(`timeout ${duration} | bitrate ${bitRate}`)

    if (!readStream || !bitRate || !duration) {
      this.errors++

      if (this.errors >= this.max_errors) {
        this.errors = 0
        this.playlistRotate()
      }

      return await this.play()
    }

    const throttler = new Throttle(parseInt(bitRate) / 8)
    const fiveSeconds = 5000
    const timeoutTimer = parseInt(duration) * 1000 + fiveSeconds
    const timer = setTimeout(() => {
      throttler.destroy()
      this._onEnded()
    }, timeoutTimer)

    console.log(`streaming started... total size: ${readStream.size}`)
    throttler.on('data', (chunk) => this.clients.map((r) => r.write(chunk)))
    throttler.on('end', () => {
      clearTimeout(timer)
      this._onEnded()
    })
    readStream.stream.pipe(throttler)
  }

  /**
   *
   */
  _onEnded() {
    console.log('finished playing...')
    this.playlistRotate()
    this.errors = 0
    this.play()
  }
}

/**
 * Class for OsanimeRadio using ExpressRadio
 */
class OsAnimeRadio extends ExpressRadio {
  osanime: OsAnime

  /**
   * @param {InterfaceRadioPlaylistItem} playlists - list of musics
   */
  constructor(playlists: InterfaceRadioPlaylistItem[] = []) {
    super(playlists)
    this.osanime = new OsAnime()
  }

  /**
   * override expressRadio createReadStream
   * @param {InterfaceRadioPlaylistItem} item - item of playlist
   * @return {Promise<NodeJS.ReadableStream | null>} nothing to say
   */
  async createReadStream(
    src: string,
    headers?: Headers,
  ): Promise<{
    stream: NodeJS.ReadableStream
    size: number
    range?: string
  } | null> {
    console.log('Creating readstream...')

    if (src.startsWith('https://osanime.com/site-down.html?to-file=')) {
      console.log('Getting file info...', src)
      const { source } = (await this.osanime.getMusicInfo(src)) || {}
      if (!source) return null
      console.log('Getting redirect url...')
      const redirectUrl = await this.osanime.getRedirect(source)
      if (!redirectUrl) return null
      console.log(`Redirect url of ${source} is ${redirectUrl}`)
      src = redirectUrl
    }

    return super.createReadStream(src, headers)
  }

  // eslint-disable-next-line require-jsdoc
  async getFfprobe(file: string): Promise<{ bitRate: string; duration: string } | null> {
    const { source } = (await this.osanime.getMusicInfo(file)) || {}
    file = await this.osanime.getRedirect(source ?? file)
    return super.getFfprobe(file)
  }
}

export { OsAnimeRadio, ExpressRadio }
