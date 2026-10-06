import cv2
import numpy as np
import os
import glob
from PIL import Image

def process_image(filepath):
    print(f"Processing {filepath}")
    # Load with PIL since it's easier to detect exact colors sometimes
    img = Image.open(filepath).convert("RGBA")
    data = np.array(img)
    
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    
    # We want to identify the checkerboard. Common fake checkerboards use 2 colors:
    # Color 1: typically white (255, 255, 255)
    # Color 2: typically light gray (e.g., 204, 204, 204 or 192, 192, 192)
    # Let's find pixels that match these exactly or are very close.
    # A safer way is to just find the dominant 2 colors in the background, but these are sprites.
    
    # What if we just threshold brightness and variance?
    # Checkerboard has standard deviations.
    
    # Let's use simple flood fill from corners if they are checkerboard.
    # But usually, it's a fixed grid of 8x8 squares.
    
    # Actually, if rembg gave us a masked version with the checkerboard inside the mask,
    # then our previous rembg completely failed to recognize it as background.
    
    # Let's manually identify white/gray pixels and make them transparent.
    # What if the bird has white? The bird has white eyes.
    # So we only want to make them transparent if they belong to a large continuous block of gray/white,
    # OR we can just use `rembg` AFTER converting the fake checkerboard to pure green or something? No, `rembg` doesn't care.

    # A simpler way: The true image might be bounded by some alpha. Here a is already something from rembg if rembg ran.
    # Wait, rembg ran, so a is 0 for actual background, but for the checkerboard it kept a=255.
    
    # Let's find pure grays. 
    gray_mask = ((r == g) & (g == b) & (r > 150))
    # Wait, what if the image has gray? e.g. the pipe has no gray, but bird has.
    
    pass

if __name__ == "__main__":
    from collections import Counter
    img = Image.open('assets1/PILLAR.png').convert("RGBA")
    data = np.array(img)
    # let's look at the colors at the top-left corner
    colors = [tuple(data[y, x]) for y in range(40) for x in range(40)]
    print("Most common colors in top-left:", Counter(colors).most_common(5))
