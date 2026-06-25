import os
import redis.asyncio as redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

pool = redis.ConnectionPool.from_url(REDIS_URL, decode_responses=True)

def get_redis() -> redis.Redis:
    return redis.Redis(connection_pool=pool)
    
async def close_redis():
    await pool.disconnect()