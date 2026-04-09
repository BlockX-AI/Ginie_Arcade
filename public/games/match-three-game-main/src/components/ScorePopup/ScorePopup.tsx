import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ScorePopup.module.css";

interface Popup {
  id: string;
  points: number;
  x: number;
  y: number;
}

interface Props {
  popups: Popup[];
}

export const ScorePopup = ({ popups }: Props) => {
  return (
    <div className={styles.popupContainer}>
      <AnimatePresence>
        {popups.map((popup) => (
          <motion.div
            key={popup.id}
            className={styles.popup}
            style={{ left: popup.x, top: popup.y }}
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: 1, scale: 1.5, y: -50 }}
            exit={{ opacity: 0, scale: 0.5, y: -100 }}
            transition={{ duration: 1 }}
          >
            +{popup.points}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
