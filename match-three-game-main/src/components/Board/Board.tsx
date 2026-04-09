import React, { useCallback, useEffect, useState } from "react";
import { Item } from "../Item";
import { motion } from "framer-motion";
import { boardWidth, generateBoard } from "../utils/generateBoard";
import { findIndexById } from "../utils/findIndexById";
import style from "./Board.module.css";
import { moveItemsDown } from "../utils/moveItemsDown";
import { removeMatchedItems } from "../utils/removeMatchedItems";
import AudioManager from "../../utils/AudioManager";

interface Props {
  onScoreChange: (score: number) => void;
  onComboChange: (combo: number) => void;
  onMoveUsed: () => void;
  isGameActive: boolean;
  resetTrigger: number;
}

export const Board = ({ onScoreChange, onComboChange, onMoveUsed, isGameActive, resetTrigger }: Props) => {
  const [legalMoves, setLegalMoves] = useState<string[] | undefined>();
  const [boardState, setBoardState] = useState(() => generateBoard(8));
  const [combo, setCombo] = useState(1);
  const [lastMatchTime, setLastMatchTime] = useState(Date.now());

  const [draggedItem, setDraggedItem] = useState("");
  const [draggedOverItem, setDraggedOverItem] = useState("");
  const [selectedTile, setSelectedTile] = useState<string | null>(null);

  useEffect(() => {
    setBoardState(generateBoard(8));
    setCombo(1);
    setLastMatchTime(Date.now());
    setSelectedTile(null);
  }, [resetTrigger]);

  const handleTileTap = (id: string) => {
    if (!isGameActive) return;

    if (selectedTile === null) {
      setSelectedTile(id);
    } else if (selectedTile === id) {
      setSelectedTile(null);
    } else {
      const selectedIndex = findIndexById(selectedTile, boardState);
      const tappedIndex = findIndexById(id, boardState);

      const rowDiff = Math.abs(selectedIndex.row - tappedIndex.row);
      const colDiff = Math.abs(selectedIndex.col - tappedIndex.col);

      const isAdjacent = (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);

      if (isAdjacent) {
        const itemBeingSelected = boardState[selectedIndex.row][selectedIndex.col];
        const itemBeingTapped = boardState[tappedIndex.row][tappedIndex.col];

        boardState[selectedIndex.row][selectedIndex.col] = itemBeingTapped;
        boardState[tappedIndex.row][tappedIndex.col] = itemBeingSelected;

        const audioManager = AudioManager.getInstance();
        audioManager.playSwapSound();

        onMoveUsed();
        setBoardState([...boardState]);
        setSelectedTile(null);
      } else {
        setSelectedTile(id);
      }
    }
  };

  const handleOnDragStart = (id: string, rowIndex: number) => {
    let adjacentMoves: string[] = [];
    const currentRow = boardState[rowIndex];
    const currentColIndex = currentRow?.findIndex((item) => item.id === id)!;

    setDraggedItem(id);

    if (currentColIndex + 1 <= boardWidth - 1) {
      adjacentMoves.push(currentRow[currentColIndex + 1].id);
    }

    if (currentColIndex - 1 >= 0) {
      adjacentMoves.push(currentRow[currentColIndex - 1].id);
    }

    if (rowIndex - 1 >= 0) {
      adjacentMoves.push(boardState[rowIndex - 1][currentColIndex].id);
    }

    if (rowIndex + 1 <= boardWidth - 1) {
      adjacentMoves.push(boardState[rowIndex + 1][currentColIndex].id);
    }

    setLegalMoves(adjacentMoves);
  };

  const handleOnDragEnd = useCallback(() => {
    if (!draggedItem || !draggedOverItem || !isGameActive) return;

    const draggedItemIndex = findIndexById(draggedItem, boardState);
    const draggedOverItemIndex = findIndexById(draggedOverItem, boardState);

    const itemBeingDragged =
      boardState[draggedItemIndex.row][draggedItemIndex.col];
    const itemBeingDraggedOver =
      boardState[draggedOverItemIndex.row][draggedOverItemIndex.col];

    boardState[draggedItemIndex.row][draggedItemIndex.col] =
      itemBeingDraggedOver;

    boardState[draggedOverItemIndex.row][draggedOverItemIndex.col] =
      itemBeingDragged;

    const audioManager = AudioManager.getInstance();
    audioManager.playSwapSound();

    onMoveUsed();
    setBoardState([...boardState]);
  }, [draggedItem, draggedOverItem, boardState, isGameActive, onMoveUsed]);

  const handleOnDragOver = useCallback(
    (id: string) => {
      if (!legalMoves || !draggedItem) return;

      if (legalMoves.includes(id)) {
        setDraggedOverItem(id);
      } else {
        setDraggedOverItem("");
      }
    },
    [draggedItem, legalMoves, setDraggedOverItem]
  );

  useEffect(() => {
    if (!isGameActive) return;

    let isProcessing = false;
    
    const processMatches = () => {
      if (isProcessing) return;
      isProcessing = true;
      
      const audioManager = AudioManager.getInstance();
      let matchCount = 0;

      removeMatchedItems(boardState, (count: number) => {
        matchCount = count;
      });

      if (matchCount > 0) {
        const now = Date.now();
        const timeSinceLastMatch = now - lastMatchTime;
        
        let currentCombo = combo;
        if (timeSinceLastMatch < 2000) {
          currentCombo = combo + 1;
          setCombo(currentCombo);
        } else {
          currentCombo = 1;
          setCombo(1);
        }
        
        setLastMatchTime(now);
        
        const basePoints = matchCount * 10;
        const comboBonus = (currentCombo - 1) * 5;
        const points = basePoints + comboBonus;
        
        onScoreChange(points);
        onComboChange(currentCombo);
        audioManager.playMatchSound();
        
        // Wait for animation, then collapse board
        setTimeout(() => {
          moveItemsDown(boardState);
          setBoardState([...boardState]);
          isProcessing = false;
        }, 300);
      } else {
        isProcessing = false;
      }
    };

    const timer = setInterval(processMatches, 400);
    return () => clearInterval(timer);
  }, [boardState, combo, lastMatchTime, isGameActive, onScoreChange, onComboChange]);

  return (
    <motion.div aria-label="game board" className={style.Board}>
      {boardState.map((row, index) => {
        return (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "row",
            }}
          >
            {row.map(({ id, type, animate, visibility, isMatch }) => {
              return (
                <Item
                  key={id}
                  item={{
                    type,
                    id,
                    animate,
                    visibility,
                    draggable: true,
                    isMatch,
                  }}
                  onDragEnd={() => handleOnDragEnd()}
                  onDragStart={() => handleOnDragStart(id, index)}
                  onDragOver={() => handleOnDragOver(id)}
                  onTap={handleTileTap}
                  isSelected={selectedTile === id}
                />
              );
            })}
          </div>
        );
      })}
    </motion.div>
  );
};
