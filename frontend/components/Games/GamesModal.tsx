"use client";

import React, { useState, useEffect } from "react";
import styles from "./GamesModal.module.css";
import { set } from "date-fns";
import { Keyboard, Repeat2 } from "lucide-react";
import { Brain, Blocks } from "lucide-react";


//props for games modal
interface GamesModalProps {
  isVisible: boolean;
  onClose: () => void;
  userLevel: number;
  userXP: number;
}

//props for each game
interface Game {
  id: string;
  name: string;
  description: string;
  minLevel: number;
  icon: string;
  component: React.ComponentType<any>;
}
/*
// Simple Click Game Component

//functionality for click frenzy game
const ClickGame: React.FC<{ onScore: (score: number) => void }> = ({ onScore }) => {

  //states to keep track fo score count, seconds remaining, and if the game is active
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isActive, setIsActive] = useState(false);

//hook to update the time left and score when the game is active
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      //sets a timer to decrement the time left and update the score
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
      //resets active state when time is up
    } else if (timeLeft === 0) {
      setIsActive(false);
      onScore(score);
    }
  }, [isActive, timeLeft, score, onScore]);

  
  const handleClick = () => {
    //sets active state and resets time and score
    if (!isActive) {
      setIsActive(true);
      setTimeLeft(10);
      setScore(0);
    }
    //increments score on click
    setScore(score + 1);
  };

  return (
    <div className={styles.gameContainer}>
      <h3>🎯 Click Frenzy</h3>
      <p>Click as fast as you can for 10 seconds!</p>
      <div className={styles.gameStats}>
        <span>Score: {score}</span>
        <span>Time: {timeLeft}s</span>
      </div>
      <button 
        className={`${styles.gameButton} ${isActive ? styles.active : ''}`}
        onClick={handleClick}
        disabled={timeLeft === 0}
      >
        {isActive ? 'CLICK ME!' : 'Start Game'}
      </button>
      {timeLeft === 0 && <p className={styles.gameResult}>Final Score: {score}</p>}
    </div>
  );
};*/

// Memory Game Component
const MemoryGame: React.FC<{ onScore: (score: number) => void }> = ({ onScore }) => {
  const [cards, setCards] = useState<number[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive) {
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8];
      const gameCards = [...numbers, ...numbers].sort(() => Math.random() - 0.5);
      setCards(gameCards);
      setFlipped([]);
      setMatched([]);
      setMoves(0);
      setIsActive(true);
    }
  }, [isActive]);

    useEffect(() => {
      if (flipped.length === 2) {
        setMoves((prev) => prev + 1); 
        const [first, second] = flipped;

        if (cards[first] === cards[second]) {
          setMatched((prev) => [...prev, first, second]);
          setFlipped([]);
        } else {
          setTimeout(() => setFlipped([]), 1000);
        }
      }
    }, [flipped, cards]);

  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0) {
      onScore(Math.max(100 - moves * 5, 10));
    }
  }, [matched, cards, moves, onScore]);

  const handleCardClick = (index: number) => {
    if (flipped.length < 2 && !flipped.includes(index) && !matched.includes(index)) {
      setFlipped([...flipped, index]);
    }
  };

  return (
    <div className={styles.gameContainer}>
      <div style = {{color: '#fffbfb'}}>
      <Brain />
      </div>
      <h3> Memory Match</h3>
      <p>Find all matching pairs!</p>
      <div className={styles.gameStats}>
        <span>Moves: {moves}</span>
       <button className={styles.retryButton} onClick={() => setIsActive(false)}>
          <Repeat2 />
        </button>
        <span>Matched: {matched.length / 2}/8</span>
      </div>
      <div className={styles.memoryGrid}>
        {cards.map((card, index) => (
          <button
            key={index}
            className={`${styles.memoryCard} ${
              flipped.includes(index) || matched.includes(index) ? styles.flipped : ''
            }`}
            onClick={() => handleCardClick(index)}
            disabled={matched.includes(index)}
          >
            {flipped.includes(index) || matched.includes(index) ? card : '?'}
          </button>
        ))}
      </div>
      {matched.length === cards.length && cards.length > 0 && (
        <p className={styles.gameResult}>Completed in {moves} moves!</p>
      )}
    </div>
  );
};
/*
// Color Match Game Component
const ColorGame: React.FC<{ onScore: (score: number) => void }> = ({ onScore }) => {
  const [currentColor, setCurrentColor] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isActive, setIsActive] = useState(false);

  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onScore(score);
    }
  }, [isActive, timeLeft, score, onScore]);

  const startGame = () => {
    setIsActive(true);
    setTimeLeft(30);
    setScore(0);
    generateNewRound();
  };

  const generateNewRound = () => {
    const color = colors[Math.floor(Math.random() * colors.length)];
    setCurrentColor(color);
    
    const shuffled = colors.sort(() => Math.random() - 0.5);
    setOptions(shuffled.slice(0, 4));
  };

  const handleColorClick = (selectedColor: string) => {
    if (selectedColor === currentColor) {
      setScore(score + 10);
    } else {
      setScore(Math.max(score - 5, 0));
    }
    generateNewRound();
  };

  return (
    <div className={styles.gameContainer}>
      <h3>🎨 Color Match</h3>
      <p>Click the color that matches the word!</p>
      <div className={styles.gameStats}>
        <span>Score: {score}</span>
        <span>Time: {timeLeft}s</span>
      </div>
      {!isActive ? (
        <button className={styles.gameButton} onClick={startGame}>
          Start Game
        </button>
      ) : (
        <div className={styles.colorGame}>
          <div className={styles.colorWord} style={{ color: currentColor }}>
            {currentColor.toUpperCase()}
          </div>
          <div className={styles.colorOptions}>
            {options.map((color, index) => (
              <button
                key={index}
                className={styles.colorOption}
                style={{ backgroundColor: color }}
                onClick={() => handleColorClick(color)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};*/

// Speed Typing Game Component
const SpeedTypingGame: React.FC<{ onScore: (score: number) => void }> = ({ onScore }) => {
  //tracking current word and user input for typing 
  const [currentWord, setCurrentWord] = useState('');
  const [userInput, setUserInput] = useState('');
  //tracking score, time left, and active state
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isActive, setIsActive] = useState(false);

  //bank of words to be typed
  const words = ['productivity', 'focus', 'success', 'achieve', 'goals', 'motivation', 'discipline', 'progress'];

  //hook to update time left and score when game is active
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onScore(score);
    }
  }, [isActive, timeLeft, score, onScore]);

  //sets active state and resets time, score, and words when game starts
  const startGame = () => {
    setIsActive(true);
    setTimeLeft(30);
    setScore(0);
    setUserInput('');
    generateNewWord();
  };

  //randomly selects word to be typed by the user
  const generateNewWord = () => {
    const word = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(word);
    setUserInput('');
  };

  //sets input equal to user's typed word and checks if it matches the current word
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setUserInput(input);
  
    //increases score count if user input matches current word
    if (input === currentWord) {
      setScore(score + 10);
      generateNewWord();
    }
  };

  return (
    <div className={styles.gameContainer}>
      <div style = {{color: '#fffbfb'}}>
      <Keyboard  />
      </div>
      <h3>Speed Typing</h3>
      <p>Type the word as fast as you can!</p>
      <div className={styles.gameStats}>
        <span style={{marginRight: '-25px'}}>Score: {score}</span>
        <button className={styles.retryButton} onClick={() => setIsActive(false)}>
          <Repeat2 />
        </button>
        <span>Time: {timeLeft}s</span>
      </div>
      {!isActive ? (
        <button className={styles.gameButton} onClick={startGame}>
          Start Game
        </button>
      ) : (
        <div className={styles.typingGame}>
          <div className={styles.wordDisplay}>{currentWord}</div>
          <input
            type="text"
            value={userInput}
            onChange={handleInputChange}
            placeholder="Type here..."
            className={styles.typingInput}
            autoFocus
          />
        </div>
      )}
    </div>
  );
};
/*
// Math Challenge Game Component
const MathGame: React.FC<{ onScore: (score: number) => void }> = ({ onScore }) => {
  const [currentProblem, setCurrentProblem] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onScore(score);
    }
  }, [isActive, timeLeft, score, onScore]);

  const generateProblem = () => {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const operation = ['+', '-', '*'][Math.floor(Math.random() * 3)];
    
    let answer;
    switch (operation) {
      case '+': answer = num1 + num2; break;
      case '-': answer = num1 - num2; break;
      case '*': answer = num1 * num2; break;
      default: answer = num1 + num2;
    }
    
    setCurrentProblem(`${num1} ${operation} ${num2} = ?`);
    setCorrectAnswer(answer);
    setUserAnswer('');
  };

  const startGame = () => {
    setIsActive(true);
    setTimeLeft(30);
    setScore(0);
    generateProblem();
  };

  const handleAnswerSubmit = () => {
    if (parseInt(userAnswer) === correctAnswer) {
      setScore(score + 10);
    }
    generateProblem();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnswerSubmit();
    }
  };

  return (
    <div className={styles.gameContainer}>
      <h3>🔢 Math Challenge</h3>
      <p>Solve the math problems quickly!</p>
      <div className={styles.gameStats}>
        <span>Score: {score}</span>
        <span>Time: {timeLeft}s</span>
      </div>
      {!isActive ? (
        <button className={styles.gameButton} onClick={startGame}>
          Start Game
        </button>
      ) : (
        <div className={styles.mathGame}>
          <div className={styles.problemDisplay}>{currentProblem}</div>
          <input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter answer..."
            className={styles.mathInput}
            autoFocus
          />
          <button className={styles.submitButton} onClick={handleAnswerSubmit}>
            Submit
          </button>
        </div>
      )}
    </div>
  );
};*/

// Pattern Memory Game Component
const PatternGame: React.FC<{ onScore: (score: number) => void }> = ({ onScore }) => {
  //holds the pattern sequence to be memorized
  const [pattern, setPattern] = useState<number[]>([]);
  //holds the user's inputted pattern sequence
  const [userPattern, setUserPattern] = useState<number[]>([]);
  //tracks score and activity states
  const [score, setScore] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isShowingPattern, setIsShowingPattern] = useState(false);

  
  useEffect(() => {
    //checkes when user validity when pattern isn't playing and user had inputted a pattern
    if (isActive && !isShowingPattern && userPattern.length === pattern.length && pattern.length > 0) {
      //increases score count if user input matches current pattern
      if (JSON.stringify(userPattern) === JSON.stringify(pattern)) {
        setScore(score + 10);
        generateNewPattern();
        //resets active state
      } else {
        onScore(score);
        setIsActive(false);
      }
    }
  }, [userPattern, pattern, score, isActive, isShowingPattern, onScore]);

  //sets active state and resets score when game starts
  const startGame = () => {
    setIsActive(true);
    setScore(0);
    generateNewPattern();
  };

  //generates new pattern sequence
  const generateNewPattern = () => {
    //selects pattern sequence by generating a random sequence of numbers 
    // and increasing difficulty as score increases
    const newPattern = Array.from({ length: score + 3 }, () => Math.floor(Math.random() * 4));
    //sets pattern sequence and user input sequence to empty
    setPattern(newPattern);
    setUserPattern([]);
    //sets showing pattern state to true and displays pattern for 2 seconds
    setIsShowingPattern(true);
    
    //sets showing pattern state to false after 2 seconds after displaying pattern
    setTimeout(() => {
      setIsShowingPattern(false);
    }, 2000);
  };

  //adds color index to user pattern sequence when clicked
  const handleColorClick = (colorIndex: number) => {
    if (!isShowingPattern && isActive) {
      setUserPattern([...userPattern, colorIndex]);
    }
  };

  return (
    <div className={styles.gameContainer}>
      <div style = {{color: '#fffbfb'}}>
      <Blocks />
      </div>
      <h3> Pattern Memory</h3>
      <p>Remember and repeat the pattern!</p>
      <div className={styles.gameStats}>
        <span style={{marginRight: '15px', marginLeft: '20px'}}>Score: {score}</span>
        <button className={styles.retryButton} onClick={() => setIsActive(false)}>
          <Repeat2 />
        </button>
        <span>Pattern Length: {pattern.length}</span>
      </div>
      {!isActive ? (
        <button className={styles.gameButton} onClick={startGame}>
          Start Game
        </button>
      ) : (
        <div className={styles.patternGame}>
          <div className={styles.patternDisplay}>
            {isShowingPattern && pattern.map((color, index) => (
              <div key={index} className={`${styles.patternColor} ${styles[`color${color}`]}`} />
            ))}
          </div>
          <div className={styles.patternGrid}>
            {[0, 1, 2, 3].map((colorIndex) => (
              <button
                key={colorIndex}
                className={`${styles.patternButton} ${styles[`color${colorIndex}`]}`}
                onClick={() => handleColorClick(colorIndex)}
                disabled={isShowingPattern}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
/*
// Reaction Time Game Component
const ReactionGame: React.FC<{ onScore: (score: number) => void }> = ({ onScore }) => {
  const [isWaiting, setIsWaiting] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [score, setScore] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const startRound = () => {
    setIsWaiting(true);
    const delay = Math.random() * 3000 + 1000; // 1-4 seconds
    setTimeout(() => {
      setStartTime(Date.now());
      setIsWaiting(false);
    }, delay);
  };

  const handleClick = () => {
    if (!isWaiting && startTime > 0) {
      const time = Date.now() - startTime;
      setReactionTime(time);
      setScore(score + Math.max(100 - Math.floor(time / 10), 10));
      setStartTime(0);
      setTimeout(startRound, 1000);
    }
  };

  const startGame = () => {
    setIsActive(true);
    setScore(0);
    startRound();
  };

  return (
    <div className={styles.gameContainer}>
      <h3>⚡ Reaction Time</h3>
      <p>Click as fast as you can when the color changes!</p>
      <div className={styles.gameStats}>
        <span>Score: {score}</span>
        <span>Last Reaction: {reactionTime}ms</span>
      </div>
      {!isActive ? (
        <button className={styles.gameButton} onClick={startGame}>
          Start Game
        </button>
      ) : (
        <div className={styles.reactionGame}>
          <button
            className={`${styles.reactionButton} ${isWaiting ? styles.waiting : styles.ready}`}
            onClick={handleClick}
          >
            {isWaiting ? 'Wait...' : 'CLICK NOW!'}
          </button>
        </div>
      )}
    </div>
  );
};

// Word Puzzle Game Component
const PuzzleGame: React.FC<{ onScore: (score: number) => void }> = ({ onScore }) => {
  const [scrambledWord, setScrambledWord] = useState('');
  const [correctWord, setCorrectWord] = useState('');
  const [userGuess, setUserGuess] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);

  const words = ['productivity', 'motivation', 'success', 'achieve', 'goals', 'focus', 'discipline', 'progress'];

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onScore(score);
    }
  }, [isActive, timeLeft, score, onScore]);

  const scrambleWord = (word: string) => {
    return word.split('').sort(() => Math.random() - 0.5).join('');
  };

  const generateNewWord = () => {
    const word = words[Math.floor(Math.random() * words.length)];
    setCorrectWord(word);
    setScrambledWord(scrambleWord(word));
    setUserGuess('');
  };

  const startGame = () => {
    setIsActive(true);
    setTimeLeft(60);
    setScore(0);
    generateNewWord();
  };

  const handleGuess = () => {
    if (userGuess.toLowerCase() === correctWord.toLowerCase()) {
      setScore(score + 10);
      generateNewWord();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGuess();
    }
  };

  return (
    <div className={styles.gameContainer}>
      <h3>🧩 Word Puzzle</h3>
      <p>Unscramble the word!</p>
      <div className={styles.gameStats}>
        <span>Score: {score}</span>
        <span>Time: {timeLeft}s</span>
      </div>
      {!isActive ? (
        <button className={styles.gameButton} onClick={startGame}>
          Start Game
        </button>
      ) : (
        <div className={styles.puzzleGame}>
          <div className={styles.scrambledWord}>{scrambledWord}</div>
          <input
            type="text"
            value={userGuess}
            onChange={(e) => setUserGuess(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your guess..."
            className={styles.puzzleInput}
            autoFocus
          />
          <button className={styles.submitButton} onClick={handleGuess}>
            Submit
          </button>
        </div>
      )}
    </div>
  );
};*/

const games: Game[] = [
  /*{
    id: 'click',
    name: 'Click Frenzy',
    description: 'Click as fast as you can!',
    minLevel: 1,
    icon: '🎯',
    component: ClickGame
  },*/
  {
    id: 'memory',
    name: 'Memory Match',
    description: 'Find matching pairs',
    minLevel: 2,
    icon: '🧠',
    component: MemoryGame
  },
 
  /*{
    id: 'color',
    name: 'Color Match',
    description: 'Match colors with words',
    minLevel: 3,
    icon: '🎨',
    component: ColorGame
  },*/
  {
    id: 'speed',
    name: 'Speed Typing',
    description: 'Type the words as fast as you can!',
    minLevel: 4,
    icon: '⌨️',
    component: SpeedTypingGame
  },
  /*
  {
    id: 'math',
    name: 'Math Challenge',
    description: 'Solve math problems quickly',
    minLevel: 5,
    icon: '🔢',
    component: MathGame
  },*/
  {
    id: 'pattern',
    name: 'Pattern Memory',
    description: 'Remember and repeat patterns',
    minLevel: 6,
    icon: '🔮',
    component: PatternGame
  }
  /*
  {
    id: 'reaction',
    name: 'Reaction Time',
    description: 'Test your reflexes',
    minLevel: 7,
    icon: '⚡',
    component: ReactionGame
  },
  {
    id: 'puzzle',
    name: 'Word Puzzle',
    description: 'Unscramble the words',
    minLevel: 8,
    icon: '🧩',
    component: PuzzleGame
  }*/
];

export default function GamesModal({ isVisible, onClose, userLevel, userXP }: GamesModalProps) {
  //holds the selected game and game score
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameScore, setGameScore] = useState<number>(0);

  //filters out games that are not available for the user based on their level
  const availableGames = games.filter(game => userLevel >= game.minLevel);

  //sets selected game and resets game score when game is selected
  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
    setGameScore(0);
  };

  //sets game score when game is completed
  const handleGameScore = (score: number) => {
    setGameScore(score);
    console.log(`Game completed with score: ${score}`);
  };

  //sets selected game and game score to null when back to games is clicked 
  // and goes back to all games modal
  const handleBackToGames = () => {
    setSelectedGame(null);
    setGameScore(0);
  };

  //returns null if modal is not visible and does not render anything
  if (!isVisible) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Mini Games</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        {!selectedGame ? (
          <div className={styles.gamesList}>
            <p className={styles.levelInfo}>
              Level {userLevel} • {userXP} XP
            </p>
            <div className={styles.gamesGrid}>
              {availableGames.map((game) => (
                <div
                  key={game.id}
                  className={styles.gameCard}
                  onClick={() => handleGameSelect(game)}
                >
                  <div className={styles.gameIcon}>{game.icon}</div>
                  <h3>{game.name}</h3>
                  <p>{game.description}</p>
                  <span className={styles.levelRequirement}>
                    Unlocked at Level {game.minLevel}
                  </span>
                </div>
              ))}
            </div>
            {availableGames.length === 0 && (
              <p className={styles.noGames}>
                Reach Level 1 to unlock your first game! 🚀
              </p>
            )}
          </div>
        ) : (
          <div className={styles.gamePlay}>
            <button className={styles.backButton} onClick={handleBackToGames}>
              ← Back to Games
            </button>
            <selectedGame.component onScore={handleGameScore} />
          </div>
        )}
      </div>
    </div>
  );
} 