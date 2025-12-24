import json
import re

INPUT = "all_videos.json"
OUTPUT = "key_and_peele_sketches.json"

# Common compilation / supercut patterns
COMPILATION_PATTERNS = re.compile(
    r"""
    compilation|
    best\sof|
    collection|
    marathon|
    full\sepisode|
    season\s\d+|
    hour|
    hours|
    minutes|
    sketches|
    playlist|
    supercut|
    promo|
    trailer|
    interview|
    behind\sthe\sscenes
    """,
    re.IGNORECASE | re.VERBOSE
)

with open(INPUT, "r", encoding="utf-8") as f:
    data = json.load(f)

entries = data.get("entries", [])

results = []

for e in entries:
    if not e:
        continue

    title = e.get("title", "").strip()
    video_id = e.get("id")

    if not title or not video_id:
        continue

    if COMPILATION_PATTERNS.search(title):
        continue

    results.append({
        "name": title,
        "videoId": video_id
    })

# Sort alphabetically for stability
results.sort(key=lambda x: x["name"].lower())

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"✅ Wrote {len(results)} sketches to {OUTPUT}")
