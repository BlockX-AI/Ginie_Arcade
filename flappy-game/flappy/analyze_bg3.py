import cv2
import numpy as np

img = cv2.imread('assets1/PILLAR.png', cv2.IMREAD_UNCHANGED)
h, w, c = img.shape
alpha = img[:,:,3]

# Find bounding box
y_indices, x_indices = np.where(alpha > 0)
if len(y_indices) > 0:
    min_x, max_x = np.min(x_indices), np.max(x_indices)
    min_y, max_y = np.min(y_indices), np.max(y_indices)
    print(f"Bounding box: x={min_x}-{max_x}, y={min_y}-{max_y}")
    
    # Let's map it to a 40x40 grid and print ascii art of alpha
    box_w = max_x - min_x
    box_h = max_y - min_y
    small = cv2.resize(alpha[min_y:max_y+1, min_x:max_x+1], (40, 20))
    for row in small:
        print("".join(['#' if p > 128 else '.' for p in row]))
else:
    print("Fully transparent")
