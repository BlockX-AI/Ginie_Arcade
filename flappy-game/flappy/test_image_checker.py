from PIL import Image
import numpy as np

img = Image.open('assets1/PILLAR.png').convert("RGBA")
data = np.array(img)

# Are there any fully opaque grey pixels forming a checkerboard?
# Check the corners
for y in range(0, 50, 10):
    for x in range(0, 50, 10):
        print(f"Pixel at {y},{x}: {data[y,x]}")
