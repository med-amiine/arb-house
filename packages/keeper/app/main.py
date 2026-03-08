"""
BCV Keeper Service - Production Ready

This service runs the keeper for the BondCreditVault:
- Event indexing: Indexes all on-chain events to database
- Balance sync: Periodically syncs agent balances with vault
- Withdrawal processing: Handles async withdrawal completion
"""
import asyncio
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.api.health import router as health_router
from app.api.vault import router as vault_router

logger = structlog.get_logger()

# Service instances
event_listener = None
withdrawal_processor = None
balance_sync = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Service lifecycle management"""
    logger.info("keeper_starting", 
                chain_id=settings.chain_id, 
                vault=settings.vault_address,
                mock_mode=settings.mock_mode)
    
    # Initialize database
    init_db()
    logger.info("database_initialized")
    
    tasks = []
    
    # Import and start blockchain services
    try:
        from app.services.event_listener import EventListener
        from app.services.withdrawal_processor import WithdrawalProcessor
        from app.services.balance_sync import BalanceSync
        
        global event_listener, withdrawal_processor, balance_sync
        
        # Start event listener
        if settings.enable_event_listener:
            event_listener = EventListener()
            tasks.append(asyncio.create_task(event_listener.run(), name="event_listener"))
            logger.info("event_listener_started")
        
        # Start withdrawal processor
        if settings.enable_withdrawal_processor:
            withdrawal_processor = WithdrawalProcessor()
            tasks.append(asyncio.create_task(withdrawal_processor.run(), name="withdrawal_processor"))
            logger.info("withdrawal_processor_started")
        
        # Start balance sync
        if settings.enable_balance_sync:
            balance_sync = BalanceSync()
            tasks.append(asyncio.create_task(balance_sync.run(), name="balance_sync"))
            logger.info("balance_sync_started")
            
    except Exception as e:
        logger.error("service_startup_failed", error=str(e))
        # Continue anyway - API endpoints can still work
    
    logger.info("keeper_started", 
                tasks=len(tasks), 
                mock_mode=settings.mock_mode,
                event_listener=settings.enable_event_listener,
                withdrawal_processor=settings.enable_withdrawal_processor,
                balance_sync=settings.enable_balance_sync)
    
    yield
    
    # Cleanup
    logger.info("keeper_shutting_down")
    
    # Stop services
    if event_listener:
        event_listener.stop()
    if withdrawal_processor:
        withdrawal_processor.stop()
    if balance_sync:
        balance_sync.stop()
    
    # Cancel tasks
    for task in tasks:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
    
    logger.info("keeper_shutdown_complete")

app = FastAPI(
    title="BCV Keeper",
    description="""
    Bond Credit Vault keeper service.
    
    ## Features
    - Event indexing from Arbitrum Sepolia
    - Automated balance syncing
    - Async withdrawal processing
    - Real-time vault state
    
    ## Architecture
    - Event Listener: Polls blockchain for events and indexes to database
    - Balance Sync: Periodically calls syncBalances() on vault
    - Withdrawal Processor: Completes async withdrawals
    """,
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
    """Service information"""
    return {
        "service": "BCV Keeper",
        "version": "1.0.0",
        "description": "Bond Credit Vault keeper service",
        "network": "arbitrum-sepolia",
        "chain_id": settings.chain_id,
        "vault": settings.vault_address,
        "mock_mode": settings.mock_mode,
        "features": {
            "event_indexing": settings.enable_event_listener,
            "withdrawal_processing": settings.enable_withdrawal_processor,
            "balance_sync": settings.enable_balance_sync,
        },
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "vault_state": "/vault/state",
            "agents": "/vault/agents",
            "transactions": "/vault/transactions",
            "yield_history": "/vault/yield-history",
            "user_balance": "/vault/user/{address}/balance",
        }
    }

@app.get("/status")
async def status():
    """Detailed service status"""
    # Check service health
    services = {
        "event_listener": event_listener is not None and event_listener.running if event_listener else False,
        "withdrawal_processor": withdrawal_processor is not None and withdrawal_processor.running if withdrawal_processor else False,
        "balance_sync": balance_sync is not None and balance_sync.running if balance_sync else False,
    }
    
    # Get queue stats
    queue_stats = {}
    if withdrawal_processor:
        queue_stats = {
            "pending_withdrawals": withdrawal_processor.pending_count,
            "queue_depth": withdrawal_processor.queue_depth
        }
    
    # Get sync status
    sync_status = {}
    if balance_sync:
        sync_status = {
            "last_sync": balance_sync.last_sync
        }
    
    return {
        "status": "operational" if any(services.values()) else "degraded",
        "mock_mode": settings.mock_mode,
        "vault_address": settings.vault_address,
        "chain_id": settings.chain_id,
        "services": services,
        "queue": queue_stats,
        "sync": sync_status,
        "configuration": {
            "sync_interval_seconds": settings.sync_interval_seconds,
            "withdrawal_poll_interval": settings.withdrawal_poll_interval_seconds,
        }
    }
