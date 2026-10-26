from pathlib import Path
from collections import deque
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "source"
OUTPUT = ROOT / "assets" / "images"

names = [
    "cat", "dog", "rabbit", "fox", "bear", "lion", "tiger", "elephant",
    "giraffe", "zebra", "monkey", "panda", "koala", "cow", "horse", "pig",
    "sheep", "goat", "deer", "squirrel", "hedgehog", "raccoon", "wolf", "owl",
    "penguin", "duck", "chicken", "frog", "turtle", "crocodile", "dolphin", "whale",
    "car", "bus", "bicycle", "train", "airplane", "boat", "apple", "banana",
    "strawberry", "carrot", "cake", "bread", "ball", "book", "chair", "clock",
    "umbrella", "key",
]


def remove_small_components(image: Image.Image) -> Image.Image:
    """Remove tiny fragments that crossed a generated sprite-cell boundary."""
    alpha = image.getchannel("A")
    pixels = alpha.load()
    width, height = image.size
    visited = bytearray(width * height)
    components = []

    for y in range(height):
        for x in range(width):
            start = y * width + x
            if visited[start] or pixels[x, y] <= 12:
                continue
            queue = deque([(x, y)])
            visited[start] = 1
            component = []
            while queue:
                current_x, current_y = queue.popleft()
                component.append((current_x, current_y))
                for next_y in range(max(0, current_y - 1), min(height, current_y + 2)):
                    for next_x in range(max(0, current_x - 1), min(width, current_x + 2)):
                        position = next_y * width + next_x
                        if not visited[position] and pixels[next_x, next_y] > 12:
                            visited[position] = 1
                            queue.append((next_x, next_y))
            components.append(component)

    if not components:
        return image
    largest_component = max(components, key=len)
    largest = len(largest_component)
    kept_components = []
    for component in components:
        touches_edge = any(x in (0, width - 1) or y in (0, height - 1) for x, y in component)
        if component is largest_component or (len(component) >= largest * 0.025 and not touches_edge):
            kept_components.append(component)
    keep = {point for component in kept_components for point in component}
    cleaned_alpha = Image.new("L", image.size, 0)
    cleaned_pixels = cleaned_alpha.load()
    for x, y in keep:
        cleaned_pixels[x, y] = pixels[x, y]
    cleaned = image.copy()
    cleaned.putalpha(cleaned_alpha)
    return cleaned


def split(path: Path, columns: int, rows: int, start: int) -> None:
    sheet = Image.open(path).convert("RGBA")
    width, height = sheet.size
    for row in range(rows):
        for column in range(columns):
            offset = row * columns + column
            index = start + offset
            left = round(column * width / columns)
            top = round(row * height / rows)
            right = round((column + 1) * width / columns)
            bottom = round((row + 1) * height / rows)
            tile = remove_small_components(sheet.crop((left, top, right, bottom)))
            tile.thumbnail((256, 256), Image.Resampling.LANCZOS)
            canvas = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
            canvas.alpha_composite(tile, ((256 - tile.width) // 2, (256 - tile.height) // 2))
            filename = f"{index + 1:02d}-{names[index]}.webp"
            canvas.save(OUTPUT / filename, "WEBP", quality=88, method=4)


OUTPUT.mkdir(parents=True, exist_ok=True)
split(SOURCE / "animals-01-16.png", 4, 4, 0)
split(SOURCE / "animals-17-32.png", 4, 4, 16)
split(SOURCE / "mixed-33-50.png", 6, 3, 32)
print(f"Created {len(list(OUTPUT.glob('*.webp')))} optimized illustrations in {OUTPUT}")
