import json
import re

# File paths
verses_path = "../public/verses.txt"
highlights_path = "../public/highlights.json"

# Load verses and split into words, splitting also on Hebrew maqaf (־)
def split_hebrew_words(text):
    # Split on whitespace or maqaf (U+05BE)
    return re.split(r'[\s\u05BE]+', text.strip())

with open(verses_path, encoding="utf-8") as f:
    verses_text = f.read()

words = split_hebrew_words(verses_text)

# Build a mapping from word to all its indices (to handle duplicates)
from collections import defaultdict
word_indices = defaultdict(list)
for idx, word in enumerate(words):
    word_indices[word].append(idx)

# Load highlights.json
with open(highlights_path, encoding="utf-8") as f:
    data = json.load(f)

# Update indices in highlights.json
def find_next_index(word, used):
    for idx in word_indices.get(word, []):
        if idx not in used:
            used.add(idx)
            return idx
    return None

for group in data["highlights"]:
    used = set()
    new_words = []
    for word, _ in group["words"]:
        idx = find_next_index(word, used)
        if idx is not None:
            new_words.append([word, idx])
    group["words"] = new_words

with open(highlights_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print("Updated highlights.json indices based on maqaf-aware word splitting.")
