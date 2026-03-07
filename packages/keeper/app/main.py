import asyncio
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.health import router as health_router
from app.api.vault import router as vault_router

logger = structlog.get_logger()

# Optional service imports
try:
    from app.services.event_listener import EventListener
    from app.services.withdrawal_processor import WithdrawalProcessor
    from app.services.balance_sync import BalanceSync
    SERVICES_AVAILABLE = True
except ImportError:
    SERVICES_AVAILABLE = False
    logger.warning("services_not_available", reason="import_error")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Service lifecycle management"""
    logger.info("keeper_starting", 
                chain_id=settings.chain_id, 
                vault=settings.vault_address,
                mock_mode=settings.mock_mode)
    
    tasks = []
    
    # Start blockchain services only if not in mock mode and services available
    if not settings.mock_mode and SERVICES_AVAILABLE:
        if settings.enable_event_listener:
            listener = EventListener()
            tasks.append(asyncio.create_task(listener.run(), name="event_listener"))
        
        if settings.enable_withdrawal_processor:
            processor = WithdrawalProcessor()
            tasks.append(asyncio.create_task(processor.run(), name="withdrawal_processor"))
        
        if settings.enable_balance_sync:
            sync = BalanceSync()
            tasks.append(asyncio.create_task(sync.run(), name="balance_sync"))
    else:
        if settings.mock_mode:
            logger.info("mock_mode_enabled", message="Running with mock data")
        else:
            logger.warning("services_disabled", message="Blockchain services not available")
    
    logger.info("keeper_started", tasks=len(tasks), mock_mode=settings.mock_mode)
    
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
    description="Bond Credit Vault keeper service - Production Ready",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(vault_router, prefix="/vault", tags=["vault"])

@app.get("/")
async def root():
    return {
        "service": "BCV Keeper",
        "version": "1.0.0",
        "vault": settings.vault_address,
        "chain_id": settings.chain_id,
        "mock_mode": settings.mock_mode,
        "endpoints": {
            "health": "/health",
            "vault_state": "/vault/state",
            "agents": "/vault/agents",
            "transactions": "/vault/transactions",
            "yield_history": "/vault/yield-history",
        }
    }

@app.get("/status")
async def status():
    """Detailed service status"""
    return {
        "status": "operational",
        "mock_mode": settings.mock_mode,
        "vault_address": settings.vault_address,
        "chain_id": settings.chain_id,
        "features": {
            "event_listener": settings.enable_event_listener and not settings.mock_mode,
            "withdrawal_processor": settings.enable_withdrawal_processor and not settings.mock_mode,
            "balance_sync": settings.enable_balance_sync and not settings.mock_mode,
            "mock_data": settings.mock_mode,
        },
        "configuration": {
            "sync_interval": settings.sync_interval_seconds,
            "withdrawal_poll_interval": settings.withdrawal_poll_interval_seconds,
        }
    }
