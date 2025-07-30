'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CARD_SYMBOLS = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎸', '🎹'];

const MemoryFlipCardGame = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [bestScore, setBestScore] = useState<{moves: number, time: number} | null>(null);

  // Initialize game
  const initializeGame = useCallback(() => {
    const shuffledCards = [...CARD_SYMBOLS, ...CARD_SYMBOLS]
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({
        id: index,
        value: symbol,
        isFlipped: false,
        isMatched: false,
      }));
    
    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setTime(0);
    setIsGameActive(false);
    setGameCompleted(false);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGameActive && !gameCompleted) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGameActive, gameCompleted]);

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Load best score from localStorage
  useEffect(() => {
    const savedBestScore = localStorage.getItem('memoryGameBestScore');
    if (savedBestScore) {
      setBestScore(JSON.parse(savedBestScore));
    }
  }, []);

  const handleCardClick = (clickedCard: Card) => {
    if (!isGameActive) {
      setIsGameActive(true);
    }

    if (
      clickedCard.isFlipped ||
      clickedCard.isMatched ||
      flippedCards.length === 2
    ) {
      return;
    }

    const newFlippedCards = [...flippedCards, clickedCard.id];
    setFlippedCards(newFlippedCards);

    setCards(prev =>
      prev.map(card =>
        card.id === clickedCard.id ? { ...card, isFlipped: true } : card
      )
    );

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      
      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards.find(card => card.id === firstId);
      const secondCard = cards.find(card => card.id === secondId);

      if (firstCard && secondCard && firstCard.value === secondCard.value) {
        // Match found
        setTimeout(() => {
          setCards(prev =>
            prev.map(card =>
              card.id === firstId || card.id === secondId
                ? { ...card, isMatched: true }
                : card
            )
          );
          setMatchedPairs(prev => prev + 1);
          setFlippedCards([]);
        }, 1000);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev =>
            prev.map(card =>
              card.id === firstId || card.id === secondId
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  // Check for game completion
  useEffect(() => {
    if (matchedPairs === CARD_SYMBOLS.length && isGameActive) {
      setGameCompleted(true);
      setIsGameActive(false);
      
      // Check if this is a new best score
      if (!bestScore || moves < bestScore.moves || (moves === bestScore.moves && time < bestScore.time)) {
        const newBestScore = { moves, time };
        setBestScore(newBestScore);
        localStorage.setItem('memoryGameBestScore', JSON.stringify(newBestScore));
      }
    }
  }, [matchedPairs, moves, time, isGameActive, bestScore]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreRating = () => {
    if (moves <= 12) return '🏆 Perfect!';
    if (moves <= 16) return '⭐ Excellent!';
    if (moves <= 20) return '👍 Good!';
    if (moves <= 25) return '👌 Not bad!';
    return '💪 Keep practicing!';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Memory Flip Card Game</h1>
        <p className={styles.subtitle}>Find all matching pairs!</p>
      </div>

      <div className={styles.gameStats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Moves:</span>
          <span className={styles.statValue}>{moves}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Time:</span>
          <span className={styles.statValue}>{formatTime(time)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Pairs:</span>
          <span className={styles.statValue}>{matchedPairs}/{CARD_SYMBOLS.length}</span>
        </div>
      </div>

      {bestScore && (
        <div className={styles.bestScore}>
          <span>🏅 Best Score: {bestScore.moves} moves in {formatTime(bestScore.time)}</span>
        </div>
      )}

      <div className={styles.gameBoard}>
        {cards.map((card) => (
          <div
            key={card.id}
            className={`${styles.card} ${
              card.isFlipped || card.isMatched ? styles.flipped : ''
            } ${card.isMatched ? styles.matched : ''}`}
            onClick={() => handleCardClick(card)}
          >
            <div className={styles.cardInner}>
              <div className={styles.cardFront}>
                <span className={styles.cardSymbol}>?</span>
              </div>
              <div className={styles.cardBack}>
                <span className={styles.cardSymbol}>{card.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {gameCompleted && (
  <div className={styles.gameCompleted}>
    <div className={styles.completionMessage}>
      <h2>🎉 Congratulations!</h2>
      <p>You completed the game!</p>
      <div className={styles.finalStats}>
        <p><strong>Moves:</strong> {moves}</p>
        <p><strong>Time:</strong> {formatTime(time)}</p>
        <p><strong>Rating:</strong> {getScoreRating()}</p>
      </div>

      {/* 👇 New Game button shown only after completion */}
      <button 
        className={styles.resetButton}
        onClick={initializeGame}
      >
        🔄 New Game
      </button>
    </div>
  </div>
)}


      <div className={styles.gameControls}>
        <button 
          className={styles.resetButton}
          onClick={initializeGame}
        >
          🔄 New Game
        </button>
      </div>

      <div className={styles.instructions}>
        <h3>How to Play:</h3>
        <ul>
          <li>Click on cards to flip them over</li>
          <li>Find matching pairs of symbols</li>
          <li>Try to complete the game in minimum moves</li>
          <li>Challenge yourself to beat your best score!</li>
        </ul>
      </div>
    </div>
  );
};

export default MemoryFlipCardGame;