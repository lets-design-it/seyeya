"""
Currencies & Exchange Rates API Endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/currencies", tags=["currencies"])

# Base currency: UGX
EXCHANGE_RATES = {
    "UGX": 1.0,
    "USD": 3700.0,
    "EUR": 4050.0,
    "GBP": 4700.0,
    "KES": 28.5
}

class CurrencyInfo(BaseModel):
    code: str
    name: str
    symbol: str
    exchange_rate_to_ugx: float
    is_default: bool = False

class ExchangeRateUpdate(BaseModel):
    code: str
    exchange_rate_to_ugx: float

class ConversionResponse(BaseModel):
    amount: float
    from_currency: str
    to_currency: str
    converted_amount: float
    rate_used: float

CURRENCY_METADATA = {
    "UGX": {"name": "Ugandan Shilling", "symbol": "UGX ", "is_default": True},
    "USD": {"name": "United States Dollar", "symbol": "$", "is_default": False},
    "EUR": {"name": "Euro", "symbol": "€", "is_default": False},
    "GBP": {"name": "British Pound", "symbol": "£", "is_default": False},
    "KES": {"name": "Kenyan Shilling", "symbol": "KSh ", "is_default": False},
}


@router.get("", response_model=List[CurrencyInfo])
async def get_currencies():
    """List all supported currencies and current exchange rates to UGX base"""
    result = []
    for code, rate in EXCHANGE_RATES.items():
        meta = CURRENCY_METADATA.get(code, {"name": code, "symbol": f"{code} ", "is_default": False})
        result.append(CurrencyInfo(
            code=code,
            name=meta["name"],
            symbol=meta["symbol"],
            exchange_rate_to_ugx=rate,
            is_default=meta["is_default"]
        ))
    return result


@router.get("/convert", response_model=ConversionResponse)
async def convert_currency(
    amount: float = Query(..., description="Amount to convert"),
    from_currency: str = Query("UGX", description="Source currency code"),
    to_currency: str = Query("USD", description="Target currency code")
):
    """Convert amount between any supported currencies using UGX base rate"""
    from_curr = from_currency.upper()
    to_curr = to_currency.upper()
    
    if from_curr not in EXCHANGE_RATES:
        raise HTTPException(status_code=400, detail=f"Unsupported currency code: {from_curr}")
    if to_curr not in EXCHANGE_RATES:
        raise HTTPException(status_code=400, detail=f"Unsupported currency code: {to_curr}")

    # Convert source amount to UGX base
    rate_from = EXCHANGE_RATES[from_curr]
    amount_in_ugx = amount * rate_from if from_curr != "UGX" else amount

    # Convert UGX base to target currency
    rate_to = EXCHANGE_RATES[to_curr]
    if to_curr == "UGX":
        converted_amount = amount_in_ugx
        rate_used = rate_from
    else:
        converted_amount = amount_in_ugx / rate_to
        rate_used = rate_to

    return ConversionResponse(
        amount=amount,
        from_currency=from_curr,
        to_currency=to_curr,
        converted_amount=round(converted_amount, 2),
        rate_used=rate_used
    )


@router.put("/rates", response_model=CurrencyInfo)
async def update_exchange_rate(payload: ExchangeRateUpdate):
    """Update exchange rate for a currency code (e.g. USD to UGX)"""
    code = payload.code.upper()
    if payload.exchange_rate_to_ugx <= 0:
        raise HTTPException(status_code=400, detail="Exchange rate must be greater than 0")

    EXCHANGE_RATES[code] = payload.exchange_rate_to_ugx
    if code not in CURRENCY_METADATA:
        CURRENCY_METADATA[code] = {"name": code, "symbol": f"{code} ", "is_default": False}

    meta = CURRENCY_METADATA[code]
    return CurrencyInfo(
        code=code,
        name=meta["name"],
        symbol=meta["symbol"],
        exchange_rate_to_ugx=payload.exchange_rate_to_ugx,
        is_default=meta["is_default"]
    )
