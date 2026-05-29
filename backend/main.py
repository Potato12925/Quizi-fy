from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.router_registry import register_routes

app = FastAPI(
    title='Quizi-fy Backend',
    version='1.0.0',
    description='Backend API for Quizi-fy',
)

# CORS CONFIG
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5175',
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

register_routes(app)

if __name__ == '__main__':
    import uvicorn

    uvicorn.run(
        'main:app',
        host='127.0.0.1',
        port=8000,
        reload=True,
    )