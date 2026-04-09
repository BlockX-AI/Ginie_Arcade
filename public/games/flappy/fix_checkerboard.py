import cv2
import numpy as np
import os

def remove_checkerboard(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        return False
    
    # Check if there is an alpha channel
    if img.shape[2] == 3:
        # add alpha channel
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    
    # Common checkerboard colors are white (255,255,255) and light gray (e.g. 204,204,204 or 192,192,192 or 160,160,160)
    # Let's find unique colors in the image to see what the background is.
    
    # We will use a script to threshold
    b, g, r, a = cv2.split(img)
    
    # A simple but effective way:
    # Most fake backgrounds are exactly 2 colors in a grid.
    # Usually they are #FFFFFF and #CCCCCC (204,204,204) or #E5E5E5 (229,229,229)
    # We can just make any pixel that is pure white or gray transparent if they are on the edges.
    
    # Let's rather just make a simple color distance metric
    # Let's save the original colors first
    pass
