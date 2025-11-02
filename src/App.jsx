import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { getRandomWord, teamColors } from './gameData'
import './App.css'

function App() {
  const [screen, setScreen] = useState('home')
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [players, setPlayers] = useState([])
  const [gameState, setGameState] = useState({
    currentWord: '',
    teamScores: {},
    wordCount: 0
  })
  const [timeLeft, setTimeLeft] = useState(60)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const createRoom = async () => {
    setLoading(true)
    try {
      const code = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      const { error: err } = await supabase.from('rooms').insert([{ code, status: 'lobby' }])
      if (err) throw err
      setRoomCode(code)
      setScreen('lobby')
    } catch (e) {
      setError('❌ שגיאה: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = async (code) => {
    setLoading(true)
    try {
      const { data, error: err } = await supabase.from('rooms').select('*').eq('code', code).single()
      if (err || !data) throw new Error('קוד לא קיים')
      setRoomCode(code)
      setScreen('lobby')
      fetchPlayers(code)
    } catch (e) {
      setError('❌ ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlayers = async (code) => {
    try {
      const { data } = await supabase.from('players').select('*').eq('room_code', code)
      setPlayers(data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const addPlayer = async () => {
    if (!playerName || !selectedTeam) {
      setError('⚠️ הזן שם וקבוצה')
      return
    }
    setLoading(true)
    try {
      const { error: err } = await supabase.from('players').insert([{ room_code: roomCode, name: playerName, team: selectedTeam, score: 0 }])
      if (err) throw err
      setPlayerName('')
      setSelectedTeam(null)
      fetchPlayers(roomCode)
    } catch (e) {
      setError('❌ ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const startGame = () => {
    if (players.length < 2) {
      setError('⚠️ צריך לפחות 2 שחקנים')
      return
    }
    setScreen('playing')
    setGameState({ ...gameState, currentWord: getRandomWord('easy'), teamScores: {}, wordCount: 1 })
    setTimeLeft(60)
  }

  useEffect(() => {
    if (screen !== 'playing') return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState(s => ({ ...s, currentWord: getRandomWord('easy'), wordCount: s.wordCount + 1 }))
          return 60
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [screen])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 אליאס</h1>
        <p>משחק ניחוש מילים חברתי</p>
      </header>

      {error && <div className="error-message">{error}</div>}

      {screen === 'home' && (
        <div className="home-screen">
          <button className="btn-primary" onClick={() => setScreen('online')}>👥 משחק אונליין</button>
        </div>
      )}

      {screen === 'online' && (
        <div className="online-screen">
          <div className="room-card">
            <h2>🔓 פתח משחק חדש</h2>
            <button className="btn-secondary" onClick={createRoom} disabled={loading}>{loading ? '⏳' : 'צור חדר'}</button>
            {roomCode && <p>קוד: <strong>{roomCode}</strong></p>}
          </div>
          <div className="room-card">
            <h2>🔗 הצטרף</h2>
            <input type="text" placeholder="קוד" maxLength="4" onChange={(e) => setRoomCode(e.target.value)} />
            <button className="btn-secondary" onClick={() => joinRoom(roomCode)} disabled={loading}>{loading ? '⏳' : 'הצטרף'}</button>
          </div>
        </div>
      )}

      {screen === 'lobby' && (
        <div className="lobby-screen">
          <h2>חדר: {roomCode}</h2>
          <input type="text" placeholder="שם" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
          <select value={selectedTeam || ''} onChange={(e) => setSelectedTeam(e.target.value)}>
            <option value="">קבוצה</option>
            {teamColors.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>
          <button className="btn-primary" onClick={addPlayer} disabled={loading}>הוסף</button>
          <div className="players-grid">{players.map(p => <div key={p.id} className="player-card"><p>{p.name}</p><p>{p.team}</p></div>)}</div>
          {players.length >= 2 && <button className="btn-primary" onClick={startGame}>התחל</button>}
        </div>
      )}

      {screen === 'playing' && (
        <div className="playing-screen">
          <div className="timer"><p>{timeLeft}</p></div>
          <div className="current-word"><p>{gameState.currentWord}</p></div>
          <p>מילה {gameState.wordCount}</p>
        </div>
      )}

      <footer className="app-footer">
        <p>© 2025</p>
      </footer>
    </div>
  )
}

export default App