import numpy as np
from PIL import Image
from collections import Counter

img = Image.open('assets1/PILLAR.png').convert("RGBA")
data = np.array(img)

h, w, _ = data.shape
print(f"Image shape: {h}x{w}")
colors = [tuple(data[y, x]) for y in range(h) for x in range(w)]
c = Counter(colors)
print("Top 10 colors:", c.most_common(10))

# print random sample of lines
print("Center line pixels:")
print(data[h//2, :20])
