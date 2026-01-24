#!/usr/bin/env python3
"""
Handwriting OCR using Google Cloud Vision API
"""

import sys
import json
import base64
import tempfile
import os
from google.cloud import vision
from google.oauth2 import service_account

def main():
    try:
        # Read input from stdin
        input_data = sys.stdin.read().strip()
        
        if not input_data:
            print(json.dumps({"success": False, "error": "No image data provided"}))
            return
        
        if input_data.startswith("data:"):
            input_data = input_data.split(",", 1)[1] if "," in input_data else input_data
        
        try:
            image_bytes = base64.b64decode(input_data)
        except Exception as e:
            print(json.dumps({"success": False, "error": f"Invalid base64: {str(e)}"}))
            return
        
        # Path to your service account key file
        # Assuming it's in the project root, relative to where this script is run (usually project root)
        key_path = os.path.abspath("industrial-cat-485320-h3-007121c04b6c.json")
        
        if not os.path.exists(key_path):
             print(json.dumps({"success": False, "error": f"Credentials file not found at {key_path}"}))
             return

        try:
            credentials = service_account.Credentials.from_service_account_file(key_path)
            client = vision.ImageAnnotatorClient(credentials=credentials)
            
            image = vision.Image(content=image_bytes)
            
            # Use document_text_detection for dense text/handwriting
            response = client.document_text_detection(image=image)
            
            if response.error.message:
                raise Exception(f'{response.error.message}')
                
            full_text = response.full_text_annotation.text
            
            # Extract lines if needed, or just split full_text
            lines = full_text.split('\n')
            
            # Confidence is not a single value in GCV, but we can average it or just return a placeholder
            # Pages -> Blocks -> Paragraphs -> Words -> Symbols (each has confidence)
            # For simplicity, we'll assume high confidence if successful
            
            print(json.dumps({
                "success": True,
                "text": full_text,
                "confidence": 99.0, 
                "lines": lines
            }))
            
        except Exception as e:
            raise Exception(f"Google Cloud Vision API Error: {str(e)}")
                
    except Exception as e:
        import traceback
        sys.stderr.write(traceback.format_exc())
        print(json.dumps({"success": False, "error": str(e), "traceback": traceback.format_exc()}))

if __name__ == "__main__":
    main()
