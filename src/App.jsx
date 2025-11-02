import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient'
import { getRandomWord, TEAM_COLORS, WORDS } from './gameData'
import './App.css'

function App() {
  // States
  const [screen, setScreen] = useState('home') // home, gameType, local, online, lobby, playing
  const [gameType, setGameType] = useState(null) // 'local' or 'online'
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [players, setPlayers] = useState([])
  const [currentPlayer, setCurrentPlayer] = useState(null)

  // Game settings
  const [gameSettings, setGameSettings] = useState({
    timer: 60,
    difficulty: 'easy',
    numTeams: 2,
    targetScore: 20
  })

  // Game state
  const [gameState, setGameState] = useState({
    currentWord: '',
    currentPresenter: null,
    teamScores: {},
    wordCount: 0
  })

  const [timeLeft, setTimeLeft] = useState(gameSettings.timer)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // LOCAL GAME FUNCTIONS
  const startLocalGame = () => {
    const teams = []
    const teamNames = TEAM_COLORS.slice(0, gameSettings.numTeams)
    teamNames.forEach(team => {
      teams[team.name] = 0
    })

    setGameState({
      currentWord: getRandomWord(gameSettings.difficulty),
      currentPresenter: 0,
      teamScores: teams,
      wordCount: 1
    })
    setTimeLeft(gameSettings.timer)
    setScreen('playing')
  }

  const handleCorrect = () => {
    const currentTeam = TEAM_COLORS[gameState.currentPresenter % gameSettings.numTeams]
    setGameState(prev => ({
      ...prev,
      teamScores: {
        ...prev.teamScores,
        [currentTeam.name]: (prev.teamScores[currentTeam.name] || 0) + 1
      }
    }))
    nextRound()
  }

  const handleSkip = () => {
    nextRound()
  }

  const handleFoul = () => {
    const currentTeam = TEAM_COLORS[gameState.currentPresenter % gameSettings.numTeams]
    setGameState(prev => ({
      ...prev,
      teamScores: {
        ...prev.teamScores,
        [currentTeam.name]: Math.max(0, (prev.teamScores[currentTeam.name] || 0) - 1)
      }
    }))
    nextRound()
  }

  const nextRound = () => {
    setGameState(prev => ({
      ...prev,
      currentWord: getRandomWord(gameSettings.difficulty),
      currentPresenter: (prev.currentPresenter + 1) % gameSettings.numTeams,
      wordCount: prev.wordCount + 1
    }))
    setTimeLeft(gameSettings.timer)
  }

  // ONLINE GAME FUNCTIONS (SUPABASE)
  const createRoom = async () => {
    setLoading(true)
    setError('')
    try {
      const code = Math.floor(Math.random() * 10000).toString().padStart(4, '0')

      const { error: err } = await supabase.from('rooms').insert([
        {
          code,
          status: 'lobby',
          settings: gameSettings
        }
      ])

      if (err) throw err

      setRoomCode(code)
      setScreen('lobby')
    } catch (err) {
      setError('❌ שגיאה: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = async (code) => {
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .single()

      if (err || !data) {
        setError('❌ קוד לא קיים')
        return
      }

      setRoomCode(code)
      setGameSettings(data.settings || gameSettings)
      setScreen('lobby')
      fetchPlayers(code)
    } catch (err) {
      setError('❌ ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlayers = async (code) => {
    try {
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('room_code', code)

      setPlayers(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (screen !== 'lobby' || !roomCode) return

    const interval = setInterval(() => {
      fetchPlayers(roomCode)
    }, 1000)

    return () => clearInterval(interval)
  }, [screen, roomCode])

  const addPlayer = async () => {
    if (!playerName || !selectedTeam) {
      setError('⚠️ הזן שם וקבוצה')
      return
    }

    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('players')
        .insert([
          {
            room_code: roomCode,
            name: playerName,
            team: selectedTeam,
            score: 0
          }
        ])
        .select()

      if (err) throw err

      setCurrentPlayer(data[0])
      setPlayerName('')
      setSelectedTeam(null)
      fetchPlayers(roomCode)
    } catch (err) {
      setError('❌ ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const startOnlineGame = async () => {
    if (players.length < 2) {
      setError('⚠️ צריך לפחות 2 שחקנים')
      return
    }

    setScreen('playing')
    setGameState({
      currentWord: getRandomWord(gameSettings.difficulty),
      currentPresenter: players[0].id,
      teamScores: {},
      wordCount: 1
    })
    setTimeLeft(gameSettings.timer)
  }

  // TIMER EFFECT
  useEffect(() => {
    if (screen !== 'playing') return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          nextRound()
          return gameSettings.timer
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [screen, gameSettings.timer])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 אליאס</h1>
        <p>משחק ניחוש מילים חברתי בזמן אמת</p>
      </header>

      {error && <div className="error-message">{error}</div>}

      {screen === 'home' && (
        <div className="screen">
          <button className="btn-primary" onClick={() => setScreen('gameType')}>
            🎮 התחל משחק
          </button>
        </div>
      )}

      {screen === 'gameType' && (
        <div className="screen">
          <button 
            className="btn-primary"
            onClick={() => {
              setGameType('local')
              setScreen('local')
            }}
          >
            🏠 משחק לוקאלי (בהתקן אחד)
          </button>
          {isSupabaseConfigured() && (
            <button 
              className="btn-primary"
              onClick={() => {
                setGameType('online')
                setScreen('online')
              }}
            >
              👥 משחק אונליין (עם חברים)
            </button>
          )}
          <button 
            className="btn-secondary"
            onClick={() => setScreen('home')}
          >
            ← חזור
          </button>
        </div>
      )}

      {screen === 'local' && (
        <div className="screen">
          <div className="card">
            <h2>🏠 הגדרות משחק לוקאלי</h2>

            <label>
              מספר קבוצות:
              <input
                type="number"
                min="2"
                max="4"
                value={gameSettings.numTeams}
                onChange={(e) => setGameSettings({...gameSettings, numTeams: parseInt(e.target.value)})}
              />
            </label>

            <label>
              טיימר (שניות):
              <select
                value={gameSettings.timer}
                onChange={(e) => setGameSettings({...gameSettings, timer: parseInt(e.target.value)})}
              >
                <option value={30}>30 שניות</option>
                <option value={45}>45 שניות</option>
                <option value={60}>60 שניות</option>
                <option value={90}>90 שניות</option>
              </select>
            </label>

            <label>
              רמה:
              <select
                value={gameSettings.difficulty}
                onChange={(e) => setGameSettings({...gameSettings, difficulty: e.target.value})}
              >
                <option value="easy">קל</option>
                <option value="medium">בינוני</option>
                <option value="hard">קשה</option>
              </select>
            </label>

            <button className="btn-start" onClick={startLocalGame}>
              ▶️ התחל משחק
            </button>

            <button 
              className="btn-secondary"
              onClick={() => setScreen('gameType')}
            >
              ← חזור
            </button>
          </div>
        </div>
      )}

      {screen === 'online' && (
        <div className="screen">
          <div className="card">
            <h2>🔓 פתח משחק חדש</h2>
            <button className="btn-secondary" onClick={createRoom} disabled={loading}>
              {loading ? '⏳ יוצר...' : 'צור חדר'}
            </button>
            {roomCode && (
              <div className="room-code">
                <p>קוד: <strong className="room-code-display">{roomCode}</strong></p>
                <button 
                  className="btn-secondary"
                  onClick={() => navigator.clipboard.writeText(roomCode)}
                >
                  📋 העתק קוד
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <h2>🔗 הצטרף למשחק קיים</h2>
            <input
              type="text"
              placeholder="הזן קוד 4 ספרות"
              maxLength="4"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && joinRoom(roomCode)}
            />
            <button className="btn-secondary" onClick={() => joinRoom(roomCode)} disabled={loading}>
              {loading ? '⏳ מצטרף...' : 'הצטרף'}
            </button>
          </div>

          <button 
            className="btn-secondary"
            onClick={() => {
              setScreen('gameType')
              setRoomCode('')
            }}
          >
            ← חזור
          </button>
        </div>
      )}

      {screen === 'lobby' && (
        <div className="screen">
          <div className="card">
            <h2>חדר משחק</h2>
            <p style={{color: '#667eea', fontSize: '24px', fontWeight: 'bold', textAlign: 'center'}}>
              קוד: {roomCode}
            </p>
          </div>

          <div className="card">
            <h2>הוסף שחקן</h2>
            <div className="input-group">
              <input
                type="text"
                placeholder="שם שחקן"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
              <select
                value={selectedTeam || ''}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="">קבוצה</option>
                {TEAM_COLORS.map(team => (
                  <option key={team.name} value={team.name}>
                    {team.name}
                  </option>
                ))}
              </select>
              <button className="btn-primary" onClick={addPlayer} disabled={loading} style={{width: 'auto'}}>
                {loading ? '⏳' : '➕'}
              </button>
            </div>
          </div>

          <div className="players-grid">
            {players.map(player => (
              <div 
                key={player.id} 
                className="player-card"
                style={{ borderColor: TEAM_COLORS.find(t => t.name === player.team)?.color }}
              >
                <p className="player-name">{player.name}</p>
                <p className="player-team" style={{ color: TEAM_COLORS.find(t => t.name === player.team)?.color }}>
                  {player.team}
                </p>
              </div>
            ))}
          </div>

          {players.length >= 2 && (
            <button className="btn-start" onClick={startOnlineGame}>
              ▶️ התחל משחק
            </button>
          )}

          <button 
            className="btn-secondary"
            onClick={() => {
              setScreen('gameType')
              setRoomCode('')
              setPlayers([])
            }}
          >
            ← חזור
          </button>
        </div>
      )}

      {screen === 'playing' && (
        <div className="screen">
          <div className="timer">
            <p>{timeLeft}</p>
          </div>

          <div className="current-word">
            <p>{gameState.currentWord}</p>
          </div>

          <div className="scores">
            {TEAM_COLORS.slice(0, gameType === 'local' ? gameSettings.numTeams : 4).map(team => (
              <div key={team.name} className="score-item">
                <span style={{ color: team.color }}>{team.name}</span>
                <span>{gameState.teamScores[team.name] || 0}</span>
              </div>
            ))}
          </div>

          <div className="game-buttons">
            <button className="btn-game btn-correct" onClick={handleCorrect}>✅ נכון</button>
            <button className="btn-game btn-skip" onClick={handleSkip}>⏭️ דילוג</button>
            <button className="btn-game btn-foul" onClick={handleFoul}>⚠️ עבירה</button>
          </div>

          <p style={{textAlign: 'center', color: 'white', fontSize: '14px'}}>
            מילה {gameState.wordCount}
          </p>
        </div>
      )}

      <footer className="app-footer">
        <p>© 2025 Nizan Waintraub | כל הזכויות שמורות</p>
        <a href="#terms">תקנון</a> | <a href="#privacy">פרטיות</a>
      </footer>
    </div>
  )
}

export default App