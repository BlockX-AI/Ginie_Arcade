import React, { useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./GameOver.module.css";
import AudioManager from "../../utils/AudioManager";

interface Props {
  score: number;
  onRestart: () => void;
  onMainMenu: () => void;
  onNextLevel?: () => void;
  isLevelComplete?: boolean;
  level?: number;
}

export const GameOver = ({ score, onRestart, onMainMenu, onNextLevel, isLevelComplete = false, level }: Props) => {
  useEffect(() => {
    const audioManager = AudioManager.getInstance();
    audioManager.stopBackgroundMusic();
    if (isLevelComplete) {
      audioManager.playVictorySound();
    } else {
      audioManager.playGameOverSound();
    }
  }, [isLevelComplete]);

  const getScoreMessage = (score: number) => {
    if (isLevelComplete) return "🎉 LEVEL COMPLETE!";
    if (score >= 1000) return "🏆 LEGENDARY!";
    if (score >= 500) return "🌟 AMAZING!";
    if (score >= 300) return "🎉 GREAT JOB!";
    if (score >= 150) return "👍 GOOD!";
    return "💪 TRY AGAIN!";
  };

  return (
    <div className={styles.gameOverContainer}>
      <motion.div
        className={styles.gameOverContent}
        initial={{ opacity: 0, scale: 0.5, y: -100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.6 }}
      >
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLevelComplete ? "LEVEL COMPLETE!" : "GAME OVER"}
        </motion.h1>

        {level && (
          <motion.div
            className={styles.levelBadge}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            Level {level}
          </motion.div>
        )}

        <motion.div
          className={styles.scoreContainer}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
        >
          <h2 className={styles.scoreLabel}>Final Score</h2>
          <motion.div
            className={styles.score}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {score}
          </motion.div>
          <p className={styles.message}>{getScoreMessage(score)}</p>
        </motion.div>

        <motion.div
          className={styles.buttonContainer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {isLevelComplete && onNextLevel ? (
            <motion.button
              className={`${styles.button} ${styles.nextLevelButton}`}
              onClick={onNextLevel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{ boxShadow: ["0 0 20px rgba(74, 222, 128, 0.5)", "0 0 40px rgba(74, 222, 128, 0.8)", "0 0 20px rgba(74, 222, 128, 0.5)"] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ➡️ NEXT LEVEL
            </motion.button>
          ) : (
            <motion.button
              className={`${styles.button} ${styles.playAgainButton}`}
              onClick={onRestart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔄 TRY AGAIN
            </motion.button>
          )}

          <motion.button
            className={`${styles.button} ${styles.menuButton}`}
            onClick={onMainMenu}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🏠 MAIN MENU
          </motion.button>
        </motion.div>

        <motion.div
          className={styles.stats}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p>💡 Tip: Match 4 or more tiles for bigger combos!</p>
        </motion.div>
      </motion.div>
    </div>
  );
};
