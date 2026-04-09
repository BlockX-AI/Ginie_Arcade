import React, { useEffect } from "react";
import { motion } from "framer-motion";
import styles from "./StartMenu.module.css";
import AudioManager from "../../utils/AudioManager";

interface Props {
  onStartGame: () => void;
}

export const StartMenu = ({ onStartGame }: Props) => {
  useEffect(() => {
    const audioManager = AudioManager.getInstance();
    audioManager.playMenuMusic();

    return () => {
      audioManager.stopMenuMusic();
    };
  }, []);

  const handleStartGame = () => {
    onStartGame();
  };

  return (
    <div className={styles.menuContainer}>
      <motion.div
        className={styles.menuContent}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className={styles.title}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Match-3 Game
        </motion.h1>

        <motion.div
          className={styles.instructions}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2>How to Play</h2>
          <ul>
            <li>🎯 Drag and swap adjacent tiles</li>
            <li>💎 Match 3 or more tiles in a row or column</li>
            <li>⏱️ Score as many points as you can in 60 seconds</li>
            <li>🔥 Create combos for bonus points!</li>
          </ul>
        </motion.div>

        <motion.button
          className={styles.playButton}
          onClick={handleStartGame}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          ▶ PLAY NOW
        </motion.button>

        <motion.div
          className={styles.footer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p>🎵 Use headphones for the best experience</p>
        </motion.div>
      </motion.div>
    </div>
  );
};
