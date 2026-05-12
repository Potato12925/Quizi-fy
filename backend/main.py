from fastapi import FastAPI

from routes.health_route import router as health_router

app = FastAPI(
    title='Quizi-fy Backend',
    version='1.0.0',
    description='Backend API for Quizi-fy',
)

app.include_router(health_router, prefix='/api/v1', tags=['Health'])


if __name__ == '__main__':
    import uvicorn

    uvicorn.run('main:app', host='127.0.0.1', port=8000, reload=True)
