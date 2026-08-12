from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.verify import router as verify_router

app = FastAPI(title="Sanad API")

# Chrome extensions call from an "chrome-extension://<id>" origin.
# For MVP dev, allow all; tighten to the specific extension ID before demo/prod.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(verify_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}
