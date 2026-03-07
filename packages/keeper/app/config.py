from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    """Keeper service configuration"""
    
    # Blockchain
    arb_rpc_url: str = Field(alias="ARB_RPC_URL")
    arb_ws_url: Optional[str] = Field(default=None, alias="ARB_WS_URL")
    chain_id: int = Field(default=42161, alias="CHAIN_ID")
    
    # Keeper identity
    keeper_private_key: str = Field(alias="KEEPER_PRIVATE_KEY")
    keeper_address: str = Field(alias="KEEPER_ADDRESS")
    
    # Contracts
    vault_address: str = Field(alias="VAULT_ADDRESS")
    
    # Giza
    giza_api_key: Optional[str] = Field(default=None, alias="GIZA_API_KEY")
    giza_agent_1_id: Optional[str] = Field(default=None, alias="GIZA_AGENT_1_ID")
    giza_agent_2_id: Optional[str] = Field(default=None, alias="GIZA_AGENT_2_ID")
    giza_agent_3_id: Optional[str] = Field(default=None, alias="GIZA_AGENT_3_ID")
    
    # Database
    database_url: str = Field(alias="DATABASE_URL")
    redis_url: str = Field(alias="REDIS_URL")
    
    # Service config
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    sync_interval_seconds: int = Field(default=300, alias="SYNC_INTERVAL_SECONDS")
    withdrawal_poll_interval_seconds: int = Field(default=10, alias="WITHDRAWAL_POLL_INTERVAL_SECONDS")
    rebalance_threshold_bps: int = Field(default=500, alias="REBALANCE_THRESHOLD_BPS")
    max_sync_stale_minutes: int = Field(default=720, alias="MAX_SYNC_STALE_MINUTES")
    
    # Monitoring
    sentry_dsn: Optional[str] = Field(default=None, alias="SENTRY_DSN")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
