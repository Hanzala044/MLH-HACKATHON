from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    default_currency: str = "INR"
    currency_pref: Optional[str] = "INR"
    country: str = "IN"
    model_mode: str = "cloud"

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    user_id: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None


class ClerkAuthRequest(BaseModel):
    clerk_id: str
    email: str
    full_name: Optional[str] = None
