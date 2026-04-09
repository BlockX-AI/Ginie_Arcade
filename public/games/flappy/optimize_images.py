import os
import glob
from PIL import Image

def optimize_images(directory):
    for filepath in glob.glob(f"{directory}/*.png"):
        img = Image.open(filepath).convert("RGBA")
        # Crop to alpha bounding box
        alpha = img.split()[-1]
        bbox = alpha.getbbox()
        if bbox:
            img = img.crop(bbox)
        
        # Now resize if it's too big.
        # Max dimension 512 is plenty for this game.
        w, h = img.size
        # BIRD, PILLAR, etc.
        filename = os.path.basename(filepath)
        if "PILLAR" in filename: # We know standard height is 360, make it ~500 for safety
            max_h = 512
            if h > max_h:
                new_w = int(w * (max_h / h))
                img = img.resize((new_w, max_h), Image.Resampling.LANCZOS)
        elif "BIRD" in filename or "0" <= filename[0] <= "9":
            max_h = 128
            if h > max_h:
                new_w = int(w * (max_h / h))
                img = img.resize((new_w, max_h), Image.Resampling.LANCZOS)
        elif "image copy" in filename: # Backgrounds
            # Don't crop backgrounds tightly to alpha, they might not have alpha
            # But the user said "only image we want in our this agem not background thing"
            # It might mean the user is complaining that the bird HAS a background.
            # But `rembg` removed the background.
            
            # The background images should be 1080p roughly max. 
            pass
        else: # gameover, flappyready
            if w > 512:
                new_h = int(h * (512 / w))
                img = img.resize((512, new_h), Image.Resampling.LANCZOS)
                
        img.save(filepath, optimize=True)
        print(f"Optimized {filename}")

if __name__ == "__main__":
    optimize_images('/Users/prakharmishra/Desktop/games/arcadegenie/Ginie_Arcade/public/games/flappy/assets1')
