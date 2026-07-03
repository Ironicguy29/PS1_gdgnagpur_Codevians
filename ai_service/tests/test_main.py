import json
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import main


class GeminiChatbotTests(unittest.TestCase):
    def test_chatbot_uses_gemini_response_when_available(self):
        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

            def read(self):
                return json.dumps({
                    "candidates": [{
                        "content": {
                            "parts": [{"text": "Hello from Gemini"}]
                        }
                    }]
                }).encode("utf-8")

        with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}, clear=False):
            with patch("app.main.urllib.request.urlopen", return_value=FakeResponse()) as mock_urlopen:
                response = main.chatbot_response(main.ChatRequest(message="hello", language="en"))

        self.assertEqual(response["source"], "gemini")
        self.assertEqual(response["response"], "Hello from Gemini")
        mock_urlopen.assert_called_once()

    def test_gemini_settings_reload_latest_environment_values(self):
        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

            def read(self):
                return json.dumps({"candidates": [{"content": {"parts": [{"text": "ok"}]}}]}).encode("utf-8")

        with patch.dict(os.environ, {"GEMINI_API_KEY": "fresh-key"}, clear=False):
            with patch("app.main.load_dotenv"), patch("app.main.urllib.request.urlopen", return_value=FakeResponse()) as mock_urlopen:
                main._get_gemini_response("hello", "en")

        request = mock_urlopen.call_args[0][0]
        self.assertIn("key=fresh-key", request.full_url)


if __name__ == "__main__":
    unittest.main()
