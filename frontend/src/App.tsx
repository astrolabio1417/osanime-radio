import './App.css'
import 'react-toastify/dist/ReactToastify.css'

import { Link, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'

import Home from './pages/home'
import { Search } from './pages/Search'
import { Song } from './pages/Song'

function App() {
  return (
    <>
      <nav className="nav">
        <Link className="nav-title" to="/">
          Anime Radio
        </Link>
        <div className="nav-links">
          <a
            href="https://animeyubi.com"
            target="_blank"
            rel="noreferrer noopener"
            className="nav-link"
          >
            Watch anime
          </a>
        </div>
      </nav>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/songs/:songId/" element={<Song />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </div>
      <ToastContainer position="bottom-right" />
    </>
  )
}

export default App
