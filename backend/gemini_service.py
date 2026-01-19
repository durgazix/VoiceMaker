import os
import google.generativeai as genai

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = "gemini-pro"
        self.client = None

        if not self.api_key:
            print("Gemini disabled: GEMINI_API_KEY not found")
            return

        try:
            genai.configure(api_key=self.api_key)
            self.client = genai.GenerativeModel(self.model_name)
            print("Gemini service initialized.")
        except Exception as e:
            print("Gemini init failed:", e)
            self.client = None

    def enhance_text(self, text: str):
        if not self.client:
            return {"enhanced_text": text}

        prompt = f"""
Improve grammar, spelling, clarity.
Do NOT translate language.
Return corrected text only.

Text:
{text}
"""
        try:
            response = self.client.generate_content(prompt)
            enhanced = response.text.strip()
            return {"enhanced_text": enhanced}
        except:
            return {"enhanced_text": text}

    def is_available(self):
        return self.client is not None
