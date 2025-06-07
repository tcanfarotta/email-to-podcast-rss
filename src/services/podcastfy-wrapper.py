#!/usr/bin/env python3
"""
Wrapper script for Podcastfy to generate podcasts from email content
"""

import sys
import json
import os
from pathlib import Path

try:
    from podcastfy.client import generate_podcast
except ImportError:
    print("Error: podcastfy not installed. Run: pip install podcastfy", file=sys.stderr)
    sys.exit(1)

def main():
    if len(sys.argv) != 4:
        print("Usage: podcastfy-wrapper.py <input_file> <output_file> <title>", file=sys.stderr)
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    title = sys.argv[3]
    
    try:
        # Read input content
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Ensure output directory exists
        Path(output_file).parent.mkdir(parents=True, exist_ok=True)
        
        # Generate podcast
        generate_podcast(
            text=content,
            output_file=output_file,
            text_to_speech_model=os.getenv('PODCASTFY_TTS_MODEL', 'openai/tts-1'),
            conversation_style=os.getenv('PODCASTFY_STYLE', 'formal'),
            dialogue_structure=os.getenv('PODCASTFY_STRUCTURE', 'monologue'),
            podcast_name="Email Podcast",
            podcast_tagline=title,
            output_format="mp3"
        )
        
        print(json.dumps({"success": True, "output": output_file}))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()