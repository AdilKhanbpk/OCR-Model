#!/usr/bin/env python3
"""
OCR.space API Usage Examples

This script demonstrates various ways to use the OCR.space API integration
for different document types and use cases.
"""

import os
import json
from pathlib import Path
from ocr_space_api import OCRSpaceAPI, ocr_from_url, ocr_from_file, image_to_base64

def example_basic_ocr():
    """Basic OCR from URL example."""
    print("=== Basic OCR from URL ===")
    
    try:
        # Simple OCR from URL
        result = ocr_from_url("https://dl.a9t9.com/ocr/solarcell.jpg")
        
        # Extract text
        client = OCRSpaceAPI()
        text = client.extract_text(result)
        
        print(f"Extracted Text:\n{text}")
        print(f"Processing Time: {result.get('ProcessingTimeInMilliseconds')}ms")
        
    except Exception as e:
        print(f"Error: {e}")

def example_file_upload():
    """OCR from local file example."""
    print("\n=== OCR from Local File ===")
    
    # Create a sample image file path (you'll need to provide an actual image)
    sample_image = "sample_document.jpg"  # Replace with actual image path
    
    if not Path(sample_image).exists():
        print(f"Sample image not found: {sample_image}")
        print("Please provide a sample image file to test file upload.")
        return
    
    try:
        result = ocr_from_file(
            sample_image,
            language='eng',
            is_table=True,  # Good for receipts and structured documents
            scale=True      # Improve quality for low-res images
        )
        
        client = OCRSpaceAPI()
        text = client.extract_text(result)
        
        print(f"File: {sample_image}")
        print(f"Extracted Text:\n{text}")
        
    except Exception as e:
        print(f"Error: {e}")

def example_advanced_features():
    """Advanced OCR features example."""
    print("\n=== Advanced OCR Features ===")
    
    client = OCRSpaceAPI()
    
    try:
        # OCR with word positions and auto-rotation
        result = client.ocr_space(
            'url',
            "https://dl.a9t9.com/ocr/solarcell.jpg",
            language='eng',
            is_overlay_required=True,    # Get word positions
            detect_orientation=True,     # Auto-rotate if needed
            ocr_engine=2,               # Use Engine 2 for better accuracy
            scale=True                  # Upscale for better quality
        )
        
        # Extract text
        text = client.extract_text(result)
        print(f"Extracted Text:\n{text[:200]}...")
        
        # Extract word positions
        words = client.extract_words_with_positions(result)
        print(f"\nFound {len(words)} words with positions")
        
        # Show first few words with positions
        for word in words[:5]:
            print(f"Word: '{word['text']}' at ({word['left']}, {word['top']}) "
                  f"size: {word['width']}x{word['height']}")
        
        # Check if orientation was detected
        parsed_results = result.get('ParsedResults', [])
        if parsed_results:
            orientation = parsed_results[0].get('TextOrientation')
            if orientation:
                print(f"Detected text orientation: {orientation}")
        
    except Exception as e:
        print(f"Error: {e}")

def example_searchable_pdf():
    """Create searchable PDF example."""
    print("\n=== Create Searchable PDF ===")
    
    client = OCRSpaceAPI()
    
    try:
        # Create searchable PDF from image
        result = client.ocr_space(
            'url',
            "https://dl.a9t9.com/ocr/solarcell.jpg",
            is_create_searchable_pdf=True,
            is_searchable_pdf_hide_text_layer=False  # Keep text layer visible
        )
        
        # Download the searchable PDF
        output_path = "searchable_output.pdf"
        if client.download_searchable_pdf(result, output_path):
            print(f"Searchable PDF created: {output_path}")
            print("Note: Free tier PDFs include a watermark")
        else:
            print("Failed to create searchable PDF")
        
    except Exception as e:
        print(f"Error: {e}")

def example_multi_language():
    """Multi-language OCR example."""
    print("\n=== Multi-language OCR ===")
    
    client = OCRSpaceAPI()
    
    # Test different languages
    test_cases = [
        ('eng', 'English'),
        ('spa', 'Spanish'),
        ('fre', 'French'),
        ('ger', 'German'),
        ('auto', 'Auto-detect (Engine 2)')
    ]
    
    for lang_code, lang_name in test_cases:
        try:
            print(f"\nTesting {lang_name} ({lang_code}):")
            
            # Use Engine 2 for auto-detect, Engine 1 for others
            engine = 2 if lang_code == 'auto' else 1
            
            result = client.ocr_space(
                'url',
                "https://dl.a9t9.com/ocr/solarcell.jpg",  # English text
                language=lang_code,
                ocr_engine=engine
            )
            
            text = client.extract_text(result)
            print(f"Result: {text[:100]}...")
            
        except Exception as e:
            print(f"Error with {lang_name}: {e}")

def example_base64_input():
    """Base64 input example."""
    print("\n=== Base64 Input ===")
    
    # Create sample base64 data (you can replace this with actual image data)
    sample_image = "sample_document.jpg"  # Replace with actual image path
    
    if not Path(sample_image).exists():
        print(f"Sample image not found: {sample_image}")
        print("Skipping base64 example - no sample image available")
        return
    
    try:
        # Convert image to base64
        base64_data = image_to_base64(sample_image)
        print(f"Converted image to base64 ({len(base64_data)} characters)")
        
        # Perform OCR on base64 data
        client = OCRSpaceAPI()
        result = client.ocr_space('base64', base64_data)
        
        text = client.extract_text(result)
        print(f"Extracted Text from base64:\n{text}")
        
    except Exception as e:
        print(f"Error: {e}")

def example_error_handling():
    """Error handling examples."""
    print("\n=== Error Handling Examples ===")
    
    client = OCRSpaceAPI()
    
    # Test invalid URL
    print("1. Testing invalid URL:")
    try:
        result = client.ocr_space('url', 'https://invalid-url-that-does-not-exist.com/image.jpg')
    except Exception as e:
        print(f"Caught expected error: {e}")
    
    # Test invalid language
    print("\n2. Testing invalid language:")
    try:
        result = client.ocr_space('url', 'https://dl.a9t9.com/ocr/solarcell.jpg', language='invalid')
    except ValueError as e:
        print(f"Caught expected error: {e}")
    
    # Test auto-detect with wrong engine
    print("\n3. Testing auto-detect with Engine 1:")
    try:
        result = client.ocr_space(
            'url', 
            'https://dl.a9t9.com/ocr/solarcell.jpg', 
            language='auto', 
            ocr_engine=1
        )
    except ValueError as e:
        print(f"Caught expected error: {e}")

def example_batch_processing():
    """Batch processing example."""
    print("\n=== Batch Processing Example ===")
    
    # Sample URLs for batch processing
    test_urls = [
        "https://dl.a9t9.com/ocr/solarcell.jpg",
        # Add more URLs here for real batch processing
    ]
    
    client = OCRSpaceAPI()
    results = []
    
    for i, url in enumerate(test_urls, 1):
        try:
            print(f"Processing image {i}/{len(test_urls)}: {url}")
            
            result = client.ocr_space('url', url, language='eng')
            text = client.extract_text(result)
            
            results.append({
                'url': url,
                'text': text,
                'success': True,
                'processing_time': result.get('ProcessingTimeInMilliseconds')
            })
            
            print(f"Success! Extracted {len(text)} characters")
            
        except Exception as e:
            print(f"Failed: {e}")
            results.append({
                'url': url,
                'error': str(e),
                'success': False
            })
    
    # Summary
    successful = sum(1 for r in results if r['success'])
    print(f"\nBatch processing complete: {successful}/{len(test_urls)} successful")

def main():
    """Run all examples."""
    print("OCR.space API Integration Examples")
    print("=" * 50)
    
    # Check if API key is configured
    api_key = os.getenv('OCR_SPACE_API_KEY', 'helloworld')
    if api_key == 'helloworld':
        print("⚠️  Using demo API key. Get your free key at https://ocr.space/ocrapi")
        print("   Set OCR_SPACE_API_KEY environment variable for full functionality.\n")
    
    # Run examples
    example_basic_ocr()
    example_advanced_features()
    example_multi_language()
    example_searchable_pdf()
    example_file_upload()
    example_base64_input()
    example_error_handling()
    example_batch_processing()
    
    print("\n" + "=" * 50)
    print("Examples complete! Check the OCR.space documentation for more features:")
    print("https://ocr.space/ocrapi")

if __name__ == "__main__":
    main()
