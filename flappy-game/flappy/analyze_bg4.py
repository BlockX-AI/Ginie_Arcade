import cv2
import numpy as np
from collections import Counter

img = cv2.imread('assets1/PILLAR.png', cv2.IMREAD_UNCHANGED)
mask = img[:,:,3] > 0
pixels = img[mask]

# Pixels are BGRA, we want BGR
bgr_pixels = [tuple(p[:3]) for p in pixels]
c = Counter(bgr_pixels)

print("Top 10 colors in the non-transparent region:")
for color, count in c.most_common(10):
    hex_color = '#%02x%02x%02x' % (color[2], color[1], color[0])
    print(f"{hex_color}: {count} pixels")
