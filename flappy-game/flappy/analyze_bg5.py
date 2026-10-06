import cv2
import numpy as np
import os
import glob
from PIL import Image

def remove_dark_checkerboard(directory):
    for filepath in glob.glob(f"{directory}/*.png"):
        if "image copy" in filepath:
            continue # Skip backgrounds
            
        print(f"Processing {filepath}")
        img = Image.open(filepath).convert("RGBA")
        data = np.array(img)
        
        # We want to identify the dark checkerboard colors.
        # It seems the background is mostly #000000 or very dark gray like #1c1b2b.
        # But wait, what if the bird has black in it? The bird has a black outline.
        # The game over text is blue/black.
        # This is risky!
        pass

# Let's write a script to just save a small crop of PILLAR.png so I can see it.
data = np.array(Image.open('assets1/PILLAR.png').convert("RGBA"))
h, w = data.shape[:2]
crop = data[h//2-20:h//2+20, w//2-20:w//2+20]
Image.fromarray(crop).save("pillar_crop.png")

data2 = np.array(Image.open('assets1/gameover.png').convert("RGBA"))
h, w = data2.shape[:2]
crop2 = data2[h//2-20:h//2+20, w//2-20:w//2+20]
Image.fromarray(crop2).save("gameover_crop.png")
