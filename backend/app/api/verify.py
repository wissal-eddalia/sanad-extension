from fastapi import APIRouter
from app.schemas.verification import VerifyRequest, VerifyResponse
from app.services.sanad_service import verify_claim

router = APIRouter()


@router.post("/verify", response_model=VerifyResponse)
async def verify(request: VerifyRequest) -> VerifyResponse:
    return await verify_claim(request)
