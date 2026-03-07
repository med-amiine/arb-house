import asyncio
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.config import settings
from app.api.health import router as health_router
from app.services.event_listener import EventListener
from app.services.withdrawal_processor import WithdrawalProcessor
from app.services.balance_sync import BalanceSync

logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Service lifecycle management"""
    logger.info("keeper_starting", chain_id=settings.chain_id, vault=settings.vault_address)
    
    # Initialize services
    listener = EventListener()
    processor = WithdrawalProcessor()
    sync = BalanceSync()
    
    # Start background tasks
    tasks = [
        asyncio.create_task(listener.run(), name="event_listener"),
        asyncio.create_task(processor.run(), name="withdrawal_processor"),
        asyncio.create_task(sync.run(), name="balance_sync"),
    ]
    
    logger.info("keeper_started", tasks=len(tasks))
    
    yield
    
    # Cleanup
    logger.info("keeper_shutting_down")
    for task in tasks:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
    logger.info("keeper_shutdown_complete")

app = FastAPI(
    title="BCV Keeper",
    description="Bond Credit Vault keeper service",
    version="0.1.0",
    lifespan=lifespan
)

app.include_router(health_router, prefix="/health", tags=["health"])

@app.get("/")
async def root():
    return {
        "service": "BCV Keeper",
        "version": "0.1.0",
        "vault": settings.vault_address,
        "chain_id": settings.chain_id
    }
