from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    tavily_api_key: str = ""
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    # If gemini_model 404s, run: GET https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY
    # to list models currently available to your key, then set GEMINI_MODEL in .env accordingly.

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
