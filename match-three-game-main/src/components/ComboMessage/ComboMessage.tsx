import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ComboMessage.module.css";

interface Props {
  combo: number;
  show: boolean;
}

export const ComboMessage = ({ combo, show }: Props) => {
  const getMessage = (combo: number) => {
    if (combo >= 10) return "🔥 INSANE COMBO! 🔥";
    if (combo >= 7) return "💥 MEGA COMBO! 💥";
    if (combo >= 5) return "⚡ SUPER COMBO! ⚡";
    if (combo >= 3) return "✨ COMBO! ✨";
    return "";
  };

  const message = getMessage(combo);

  return (
    <AnimatePresence>
      {show && message && (
        <motion.div
          className={styles.comboMessage}
          initial={{ opacity: 0, scale: 0, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: 50 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <motion.h1
            className={styles.messageText}
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [-5, 5, -5, 0]
            }}
            transition={{ 
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 0.5
            }}
          >
            {message}
          </motion.h1>
          <motion.p
            className={styles.comboCount}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          >
            x{combo} COMBO
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
