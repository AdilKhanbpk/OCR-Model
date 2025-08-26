#!/usr/bin/env python3
"""
OCR.space API Integration Module

A comprehensive Python module for integrating with the OCR.space API.
Supports free-tier usage with URL, file upload, and base64 input methods.

Author: OCR Service Team
License: MIT
"""

import os
import base64
import logging
import requests
from typing import Dict, Any, Optional, Union
from pathlib import Path
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class OCRSpaceAPI:
    """
    OCR.space API client for free-tier optical character recognition.
    
    Supports multiple input methods (URL, file, base64) and all free-tier features
    including language detection, overlay data, and searchable PDF creation.
    """
    
    # API endpoints
    POST_ENDPOINT = "https://api.ocr.space/parse/image"
    GET_ENDPOINT = "https://api.ocr.space/parse/imageurl"
    
    # Supported languages
    LANGUAGES = {
        'ara': 'Arabic', 'bul': 'Bulgarian', 'chs': 'Chinese Simplified',
        'cht': 'Chinese Traditional', 'hrv': 'Croatian', 'cze': 'Czech',
        'dan': 'Danish', 'dut': 'Dutch', 'eng': 'English', 'fin': 'Finnish',
        'fre': 'French', 'ger': 'German', 'gre': 'Greek', 'hun': 'Hungarian',
        'kor': 'Korean', 'ita': 'Italian', 'jpn': 'Japanese', 'pol': 'Polish',
        'por': 'Portuguese', 'rus': 'Russian', 'slv': 'Slovenian',
        'spa': 'Spanish', 'swe': 'Swedish', 'tha': 'Thai', 'tur': 'Turkish',
        'ukr': 'Ukrainian', 'vnm': 'Vietnamese', 'auto': 'Auto-detect (Engine 2 only)'
    }
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize OCR.space API client.
        
        Args:
            api_key: API key for OCR.space. If None, loads from environment variable.
        """
        self.api_key = api_key or os.getenv('OCR_SPACE_API_KEY', 'helloworld')
        if self.api_key == 'helloworld':
            logger.warning("Using demo API key. Get your free key at https://ocr.space/ocrapi")
    
    def ocr_space(
        self,
        input_type: str,
        input_value: str,
        language: str = 'eng',
        is_overlay_required: bool = False,
        filetype: Optional[str] = None,
        detect_orientation: bool = False,
        is_create_searchable_pdf: bool = False,
        is_searchable_pdf_hide_text_layer: bool = False,
        scale: bool = False,
        is_table: bool = False,
        ocr_engine: int = 1,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Perform OCR on image or PDF using OCR.space API.
        
        Args:
            input_type: Type of input ('url', 'file', 'base64')
            input_value: URL string, file path, or base64 string
            language: Language code (default: 'eng')
            is_overlay_required: Return word bounding boxes (default: False)
            filetype: Override file type detection (e.g., 'PDF', 'PNG')
            detect_orientation: Auto-rotate image (default: False)
            is_create_searchable_pdf: Create searchable PDF (default: False)
            is_searchable_pdf_hide_text_layer: Hide text layer in PDF (default: False)
            scale: Upscale low-resolution images (default: False)
            is_table: Optimize for table/receipt layout (default: False)
            ocr_engine: OCR engine to use (1 or 2, default: 1)
            
        Returns:
            Dict containing OCR results and metadata
            
        Raises:
            ValueError: For invalid input parameters
            requests.RequestException: For API communication errors
            Exception: For OCR processing errors
        """
        # Validate inputs
        if input_type not in ['url', 'file', 'base64']:
            raise ValueError("input_type must be 'url', 'file', or 'base64'")
        
        if language not in self.LANGUAGES:
            raise ValueError(f"Unsupported language: {language}. Use one of: {list(self.LANGUAGES.keys())}")
        
        if ocr_engine not in [1, 2]:
            raise ValueError("ocr_engine must be 1 or 2")
        
        if language == 'auto' and ocr_engine != 2:
            raise ValueError("Auto-detect language is only available with OCR Engine 2")
        
        # Prepare request parameters
        params = {
            'apikey': self.api_key,
            'language': language,
            'isOverlayRequired': str(is_overlay_required).lower(),
            'detectOrientation': str(detect_orientation).lower(),
            'isCreateSearchablePdf': str(is_create_searchable_pdf).lower(),
            'isSearchablePdfHideTextLayer': str(is_searchable_pdf_hide_text_layer).lower(),
            'scale': str(scale).lower(),
            'isTable': str(is_table).lower(),
            'OCREngine': str(ocr_engine)
        }
        
        if filetype:
            params['filetype'] = filetype
        
        # Handle different input types
        try:
            if input_type == 'url':
                return self._ocr_from_url(input_value, params)
            elif input_type == 'file':
                return self._ocr_from_file(input_value, params)
            elif input_type == 'base64':
                return self._ocr_from_base64(input_value, params)
        except requests.RequestException as e:
            logger.error(f"API request failed: {e}")
            raise
        except Exception as e:
            logger.error(f"OCR processing failed: {e}")
            raise
    
    def _ocr_from_url(self, url: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Process OCR from image URL."""
        params['url'] = url
        
        # Use GET endpoint for URL-only requests (simpler)
        logger.info(f"Processing OCR from URL: {url}")
        response = requests.get(self.GET_ENDPOINT, params=params, timeout=60)
        response.raise_for_status()
        
        return self._process_response(response.json())
    
    def _ocr_from_file(self, file_path: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Process OCR from local file."""
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Determine content type
        content_type = self._get_content_type(file_path.suffix.lower())
        
        logger.info(f"Processing OCR from file: {file_path} ({content_type})")
        
        with open(file_path, 'rb') as file:
            files = {'file': (file_path.name, file, content_type)}
            response = requests.post(
                self.POST_ENDPOINT,
                data=params,
                files=files,
                timeout=120  # Longer timeout for file uploads
            )
            response.raise_for_status()
        
        return self._process_response(response.json())
    
    def _ocr_from_base64(self, base64_string: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Process OCR from base64 encoded image/PDF."""
        # Validate base64 format
        if not base64_string.startswith('data:'):
            raise ValueError("Base64 string must include data URI prefix (e.g., data:image/jpeg;base64,...)")
        
        params['base64Image'] = base64_string
        
        logger.info("Processing OCR from base64 data")
        response = requests.post(self.POST_ENDPOINT, data=params, timeout=120)
        response.raise_for_status()
        
        return self._process_response(response.json())
    
    def _get_content_type(self, extension: str) -> str:
        """Get MIME type from file extension."""
        content_types = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.png': 'image/png', '.gif': 'image/gif',
            '.webp': 'image/webp', '.tiff': 'image/tiff',
            '.tif': 'image/tiff', '.pdf': 'application/pdf'
        }
        return content_types.get(extension, 'application/octet-stream')
    
    def _process_response(self, response_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process and validate API response."""
        # Check for API errors
        if response_data.get('IsErroredOnProcessing', False):
            error_msg = response_data.get('ErrorMessage', 'Unknown error')
            error_details = response_data.get('ErrorDetails', '')
            raise Exception(f"OCR processing error: {error_msg}. Details: {error_details}")
        
        # Check OCR exit code
        ocr_exit_code = response_data.get('OCRExitCode', 0)
        if ocr_exit_code == 3:
            raise Exception("All OCR processing failed")
        elif ocr_exit_code == 4:
            raise Exception("Fatal OCR error occurred")
        elif ocr_exit_code == 2:
            logger.warning("Partial OCR success - some pages may have failed")
        
        # Log processing time
        processing_time = response_data.get('ProcessingTimeInMilliseconds', 'Unknown')
        logger.info(f"OCR completed in {processing_time}ms")
        
        return response_data
    
    def extract_text(self, response_data: Dict[str, Any]) -> str:
        """Extract plain text from OCR response."""
        texts = []
        parsed_results = response_data.get('ParsedResults', [])
        
        for result in parsed_results:
            if result.get('FileParseExitCode') == 1:  # Success
                text = result.get('ParsedText', '').strip()
                if text:
                    texts.append(text)
        
        return '\n\n'.join(texts)
    
    def extract_words_with_positions(self, response_data: Dict[str, Any]) -> list:
        """Extract words with bounding box coordinates (requires isOverlayRequired=True)."""
        words_data = []
        parsed_results = response_data.get('ParsedResults', [])
        
        for page_idx, result in enumerate(parsed_results):
            if result.get('FileParseExitCode') == 1:  # Success
                text_overlay = result.get('TextOverlay', {})
                lines = text_overlay.get('Lines', [])
                
                for line_idx, line in enumerate(lines):
                    words = line.get('Words', [])
                    for word_idx, word in enumerate(words):
                        words_data.append({
                            'page': page_idx + 1,
                            'line': line_idx + 1,
                            'word_index': word_idx + 1,
                            'text': word.get('WordText', ''),
                            'left': word.get('Left', 0),
                            'top': word.get('Top', 0),
                            'height': word.get('Height', 0),
                            'width': word.get('Width', 0)
                        })
        
        return words_data
    
    def download_searchable_pdf(self, response_data: Dict[str, Any], output_path: str) -> bool:
        """Download searchable PDF if created."""
        pdf_url = response_data.get('SearchablePDFURL')
        if not pdf_url:
            logger.warning("No searchable PDF URL found in response")
            return False
        
        try:
            logger.info(f"Downloading searchable PDF from: {pdf_url}")
            pdf_response = requests.get(pdf_url, timeout=60)
            pdf_response.raise_for_status()
            
            with open(output_path, 'wb') as f:
                f.write(pdf_response.content)
            
            logger.info(f"Searchable PDF saved to: {output_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to download searchable PDF: {e}")
            return False
    
    def get_supported_languages(self) -> Dict[str, str]:
        """Get dictionary of supported language codes and names."""
        return self.LANGUAGES.copy()


# Helper functions for common use cases
def ocr_from_url(url: str, **kwargs) -> Dict[str, Any]:
    """Quick OCR from URL with default settings."""
    client = OCRSpaceAPI()
    return client.ocr_space('url', url, **kwargs)


def ocr_from_file(file_path: str, **kwargs) -> Dict[str, Any]:
    """Quick OCR from file with default settings."""
    client = OCRSpaceAPI()
    return client.ocr_space('file', file_path, **kwargs)


def ocr_from_base64(base64_data: str, **kwargs) -> Dict[str, Any]:
    """Quick OCR from base64 data with default settings."""
    client = OCRSpaceAPI()
    return client.ocr_space('base64', base64_data, **kwargs)


def image_to_base64(image_path: str) -> str:
    """Convert image file to base64 data URI."""
    file_path = Path(image_path)
    if not file_path.exists():
        raise FileNotFoundError(f"Image file not found: {file_path}")
    
    # Determine MIME type
    extension = file_path.suffix.lower()
    mime_types = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.png': 'image/png', '.gif': 'image/gif',
        '.webp': 'image/webp', '.tiff': 'image/tiff',
        '.tif': 'image/tiff'
    }
    mime_type = mime_types.get(extension, 'image/jpeg')
    
    # Read and encode
    with open(file_path, 'rb') as f:
        encoded = base64.b64encode(f.read()).decode('utf-8')
    
    return f"data:{mime_type};base64,{encoded}"


if __name__ == "__main__":
    # Example usage and testing
    import sys
    
    def main():
        """Example usage of OCR.space API."""
        print("OCR.space API Integration Examples")
        print("=" * 40)
        
        # Initialize client
        client = OCRSpaceAPI()
        
        # Example 1: OCR from URL
        print("\n1. OCR from URL:")
        try:
            test_url = "https://dl.a9t9.com/ocr/solarcell.jpg"
            result = client.ocr_space('url', test_url, language='eng')
            text = client.extract_text(result)
            print(f"Extracted text: {text[:200]}...")
        except Exception as e:
            print(f"Error: {e}")
        
        # Example 2: OCR with overlay data
        print("\n2. OCR with word positions:")
        try:
            result = client.ocr_space(
                'url', 
                "https://dl.a9t9.com/ocr/solarcell.jpg",
                is_overlay_required=True
            )
            words = client.extract_words_with_positions(result)
            print(f"Found {len(words)} words with positions")
            if words:
                print(f"First word: {words[0]}")
        except Exception as e:
            print(f"Error: {e}")
        
        # Example 3: Auto-detect language with Engine 2
        print("\n3. Auto-detect language:")
        try:
            result = client.ocr_space(
                'url',
                "https://dl.a9t9.com/ocr/solarcell.jpg",
                language='auto',
                ocr_engine=2
            )
            text = client.extract_text(result)
            print(f"Auto-detected text: {text[:100]}...")
        except Exception as e:
            print(f"Error: {e}")
        
        # Example 4: Create searchable PDF
        print("\n4. Create searchable PDF:")
        try:
            result = client.ocr_space(
                'url',
                "https://dl.a9t9.com/ocr/solarcell.jpg",
                is_create_searchable_pdf=True
            )
            if client.download_searchable_pdf(result, "output_searchable.pdf"):
                print("Searchable PDF created successfully!")
        except Exception as e:
            print(f"Error: {e}")
        
        print("\nSupported languages:")
        languages = client.get_supported_languages()
        for code, name in list(languages.items())[:5]:  # Show first 5
            print(f"  {code}: {name}")
        print(f"  ... and {len(languages) - 5} more")
    
    if __name__ == "__main__":
        main()
