from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse, ClerkAuthRequest
from app.security import hash_password, verify_password, create_access_token, get_current_user_id

router = APIRouter(prefix="/auth", tags=["auth"])


def _build_token_response(user: User) -> TokenResponse:
    token = create_access_token({"sub": str(user.id)})
    user_resp = UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        default_currency=getattr(user, "default_currency", "INR") or "INR",
        currency_pref=getattr(user, "currency_pref", "INR") or "INR",
        country=user.country or "IN",
        model_mode=user.model_mode or "cloud"
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_resp,
        user_id=str(user.id),
        email=user.email,
        full_name=user.full_name
    )


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user = User(
        email=req.email.lower().strip(),
        password_hash=hash_password(req.password),
        full_name=req.full_name or req.email.split("@")[0]
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return _build_token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    return _build_token_response(user)


@router.post("/demo", response_model=TokenResponse)
def login_demo(db: Session = Depends(get_db)):
    """Instant login for hackathon judges & demo."""
    demo_email = "demo@receiptwise.app"
    user = db.query(User).filter(User.email == demo_email).first()
    if not user:
        user = User(
            email=demo_email,
            password_hash=hash_password("demopassword123"),
            full_name="Asha (Demo Freelancer)",
            default_currency="INR",
            country="IN",
            model_mode="cloud"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return _build_token_response(user)


@router.post("/clerk", response_model=TokenResponse)
def clerk_auth(req: ClerkAuthRequest, db: Session = Depends(get_db)):
    """Authenticate or register user via Clerk."""
    email = req.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            password_hash=hash_password(f"clerk_{req.clerk_id}"),
            full_name=req.full_name or email.split("@")[0],
            default_currency="INR",
            country="IN",
            model_mode="cloud"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if req.full_name and not user.full_name:
            user.full_name = req.full_name
            db.commit()
            db.refresh(user)

    return _build_token_response(user)


@router.get("/me", response_model=UserResponse)
def get_me(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        default_currency=getattr(user, "default_currency", "INR") or "INR",
        currency_pref=getattr(user, "currency_pref", "INR") or "INR",
        country=user.country or "IN",
        model_mode=user.model_mode or "cloud"
    )
