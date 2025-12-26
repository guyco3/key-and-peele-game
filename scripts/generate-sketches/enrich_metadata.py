import json
from googleapiclient.discovery import build

# 🔑 Setup
API_KEY = ''
INPUT_FILE = 'sketches_with_difficulty.json'
OUTPUT_FILE = 'sketches_with_difficulty2.json'

def get_difficulty(views):
    """
    Tier thresholds based on Comedy Central views:
    Easy: > 15M | Medium: 4M - 15M | Hard: < 4M
    """
    views = int(views)
    if views > 15_000_000:
        return "easy"
    elif views > 4_000_000:
        return "medium"
    else:
        return "hard"

def main():
    youtube = build('youtube', 'v3', developerKey=API_KEY)
    
    with open(INPUT_FILE, 'r') as f:
        data = json.load(f)
        raw_entries = data.get('entries', []) if isinstance(data, dict) else data 
        
    # Map YouTube IDs to the original objects
    id_to_original = {e['youtubeId']: e for e in raw_entries if 'youtubeId' in e}
    all_yt_ids = list(id_to_original.keys())

    if not all_yt_ids:
        print("❌ Error: No 'youtubeId' fields found in input.")
        return

    view_map = {}
    skipped_count = 0

    print(f"Enriching {len(all_yt_ids)} videos...")
    
    for i in range(0, len(all_yt_ids), 50):
        chunk = all_yt_ids[i:i+50]
        request = youtube.videos().list(
            part="statistics,snippet",
            id=",".join(chunk)
        )
        response = request.execute()

        for item in response.get('items', []):
            vid_id = item['id']
            snippet = item.get('snippet', {})
            
            # 1. Combine tags from API and your local file
            api_tags = [t.lower() for t in snippet.get('tags', [])]
            local_tags = [t.lower() for t in id_to_original[vid_id].get('tags', [])]
            combined_tags = set(api_tags + local_tags)
            
            # 2. STRICT TAG CHECK
            # This looks for the words anywhere in the tag list
            exclude_keywords = {"shorts", "#shorts", "compilation"}
            if combined_tags.intersection(exclude_keywords):
                skipped_count += 1
                continue

            # 3. Process valid videos
            views = int(item['statistics'].get('viewCount', 0))
            desc = snippet.get('description', "").split('\n')[0]
            
            view_map[vid_id] = {
                "views": views,
                "description": desc,
                "difficulty": get_difficulty(views)
            }

    # 4. Rebuild the list with enriched data
    final_sketches = []
    for yt_id, original_obj in id_to_original.items():
        stats = view_map.get(yt_id)
        if stats:
            original_obj['views'] = stats['views']
            original_obj['difficulty'] = stats['difficulty']
            # Only update description if it's currently missing or generic
            if not original_obj.get('description'):
                original_obj['description'] = stats['description']
            final_sketches.append(original_obj)

    with open(OUTPUT_FILE, 'w') as f:
        json.dump(final_sketches, f, indent=2)

    print(f"✅ Success: {len(final_sketches)} sketches saved to {OUTPUT_FILE}")
    print(f"🚫 Filtered: {skipped_count} videos containing 'shorts' or 'compilation' tags.")

if __name__ == "__main__":
    main()