import cv2
import numpy as np
from PIL import Image

img = Image.open('assets1/PILLAR.png').convert("RGBA")
data = np.array(img)
h, w, _ = data.shape
colors = [tuple(data[y, x]) for y in range(h//2-20, h//2+20) for x in range(w//2-20, w//2+20)]
from collections import Counter
print("Center:", Counter(colors).most_common(10))
