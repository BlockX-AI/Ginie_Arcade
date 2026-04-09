import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./HUD.module.css";
import AudioManager from "../../utils/AudioManager";

interface Props {
  score: number;
  movesLeft: number;
  combo: number;
  targetScore: number;
  level: number;
}

export const HUD = ({ score, movesLeft, combo, targetScore, level }: Props) => {
  const [isMuted, setIsMuted] = useState(false);

  const handleMuteToggle = () => {
    const audioManager = AudioManager.getInstance();
    const newMuteState = audioManager.toggleMute();
    setIsMuted(newMuteState);
  };

  const getMovesColor = () => {
    if (movesLeft <= 5) return "#ff4757";
    if (movesLeft <= 10) return "#ffa502";
    return "#2ed573";
  };

  const progress = Math.min((score / targetScore) * 100, 100);

  return (
    <div className={styles.hudContainer}>
      <div className={styles.leftSection}>
        <motion.div
          className={styles.scoreContainer}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className={styles.label}>SCORE</div>
          <motion.div
            className={styles.scoreValue}
            key={score}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            {score}
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {combo > 1 && (
            <motion.div
              className={styles.comboContainer}
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0, y: -20 }}
            >
              <motion.div
                className={styles.comboText}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 0.5 }}
              >
                🔥 COMBO x{combo}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={styles.centerSection}>
        <motion.div
          className={styles.timerContainer}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.timerLabel}>LEVEL {level}</div>
          <div className={styles.targetContainer}>
            <div className={styles.targetLabel}>Target: {targetScore}</div>
            <div className={styles.progressBar}>
              <motion.div 
                className={styles.progressFill}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          <motion.div
            className={styles.timerValue}
            style={{ color: getMovesColor() }}
            animate={movesLeft <= 5 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: movesLeft <= 5 ? Infinity : 0 }}
          >
            {movesLeft} MOVES
          </motion.div>
        </motion.div>
      </div>

      <div className={styles.rightSection}>
        <motion.button
          className={styles.muteButton}
          onClick={handleMuteToggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {isMuted ? "🔇" : "🔊"}
        </motion.button>
      </div>
    </div>
  );
};
