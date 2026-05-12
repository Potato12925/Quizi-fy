from core.responses import success_response


async def health_check():
    return success_response(
        data={"status": "ok"},
        message="Backend is running",
        status_code=200,
    )
