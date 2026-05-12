from fastapi import FastAPI

from routes.router_registry import register_routes

app = FastAPI(
    title='Quizi-fy Backend',
    version='1.0.0',
    description='Backend API for Quizi-fy',
)

register_routes(app)


if __name__ == '__main__':
    import uvicorn

    uvicorn.run('main:app', host='127.0.0.1', port=8000, reload=True)
