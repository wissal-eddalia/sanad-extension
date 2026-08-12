import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ GEMINI_API_KEY is not set")
    exit(1)

print("🔑 API key found!")

try:
    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Reply with exactly: Gemini API is working!"
    )

    print("✅ Gemini API key works!")
    print("Response:", response.text)

except Exception as e:
    print("❌ Gemini API request failed")
    print(type(e).__name__)
    print(e)