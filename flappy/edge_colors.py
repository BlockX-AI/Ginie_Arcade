import cv2
import numpy as np
from collections import Counter

# Load the file
img = cv2.imread('assets1/PILLAR.png', cv2.IMREAD_UNCHANGED)

# Create a mask of non-transparent edges
alpha = img[:,:,3]
_, thresh = cv2.threshold(alpha, 128, 255, cv2.THRESH_BINARY)
contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

if len(contours) > 0:
    c = max(contours, key=cv2.contourArea)
    # Get the bounding box of the main object
    x, y, w, h = cv2.boundingRect(c)
    
    # Let's sample pixels just inside the bounding box vertically, along the left and right edges.
    edge_pixels = []
    for dy in range(10, h-10, 5):
        try:
            # left edge
            for dx in range(5):
                p_left = img[y + dy, x + dx]
                if p_left[3] > 0: edge_pixels.append(tuple(p_left[:3]))
            # right edge
            for dx in range(5):
                p_right = img[y + dy, x + w - 1 - dx]
                if p_right[3] > 0: edge_pixels.append(tuple(p_right[:3]))
        except:
            pass
            
    c_edge = Counter(edge_pixels)
    print("Most common colors on the edges of the object:")
    for color, count in c_edge.most_common(10):
        print(f"#{color[2]:02x}{color[1]:02x}{color[0]:02x} : {count}")
