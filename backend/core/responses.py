from typing import Any, Optional
from fastapi.responses import JSONResponse


def success_response(
    data: Any = None,
    message: str = "Success",
    status_code: int = 200,
    meta: Optional[dict] = None,
):
    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "message": message,
            "data": data,
            "meta": meta,
        },
    )



def error_response(
    message: str = "Error",
    status_code: int = 400,
    error_code: str = "BAD_REQUEST",
    details: Any = None,
):
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "error": {
                "code": error_code,
                "details": details,
            },
        },
    )