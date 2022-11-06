import './App.css'

import { Link, Route, Routes } from 'react-router-dom'

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
      </nav>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/songs/:songId/" element={<Song />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </div>
    </>
  )
}

export default App
