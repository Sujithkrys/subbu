import os
import urllib.request

fonts_dir = "e:/Subbu/subtitle-platform/frontend/public/fonts"
os.makedirs(fonts_dir, exist_ok=True)

fonts = {
    "Montserrat-Black.ttf": "https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Black.ttf",
    "Montserrat-Bold.ttf": "https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf/Montserrat-Bold.ttf",
}

for filename, url in fonts.items():
    path = os.path.join(fonts_dir, filename)
    print(f"Downloading {filename}...")
    try:
        urllib.request.urlretrieve(url, path)
        print(f"Saved {filename}")
    except Exception as e:
        print(f"Failed to download {filename}: {e}")
