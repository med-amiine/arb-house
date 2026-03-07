from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    """Keeper service configuration"""
    
    # Blockchain
    arb_rpc_url: str = Field(default="https://arbitrum-sepolia.drpc.org", alias="ARB_RPC_URL")
    arb_ws_url: Optional[str] = Field(default=None, alias="ARB_WS_URL")
    chain_id: int = Field(default=421614, alias="CHAIN_ID")  # Sepolia testnet
    
    # Keeper identity (defaults for mock mode)
    keeper_private_key: str = Field(default="0x" + "1" * 64, alias="KEEPER_PRIVATE_KEY")
    keeper_address: str = Field(default="0x" + "2" * 40, alias="KEEPER_ADDRESS")
    
    # Contracts
    vault_address: str = Field(default="0x910a7b063021eC417227F3Cb7f0178f28bc0BA4E", alias="VAULT_ADDRESS")
    
    # Feature flags
    mock_mode: bool = Field(default=True, alias="MOCK_MODE")  # Enable mock data for testing
    enable_event_listener: bool = Field(default=True, alias="ENABLE_EVENT_LISTENER")
    enable_withdrawal_processor: bool = Field(default=True, alias="ENABLE_WITHDRAWAL_PROCESSOR")
    enable_balance_sync: bool = Field(default=True, alias="ENABLE_BALANCE_SYNC")
    
    # Giza (optional)
    giza_api_key: Optional[str] = Field(default=None, alias="GIZA_API_KEY")
    giza_agent_1_id: Optional[str] = Field(default=None, alias="GIZA_AGENT_1_ID")
    giza_agent_2_id: Optional[str] = Field(default=None, alias="GIZA_AGENT_2_ID")
    giza_agent_3_id: Optional[str] = Field(default=None, alias="GIZA_AGENT_3_ID")
    
    # Database (optional for mock mode)
    database_url: Optional[str] = Field(default="sqlite:///./keeper.db", alias="DATABASE_URL")
    redis_url: Optional[str] = Field(default=None, alias="REDIS_URL")
    
    # Service config
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    sync_interval_seconds: int = Field(default=60, alias="SYNC_INTERVAL_SECONDS")
    withdrawal_poll_interval_seconds: int = Field(default=10, alias="WITHDRAWAL_POLL_INTERVAL_SECONDS")
    rebalance_threshold_bps: int = Field(default=500, alias="REBALANCE_THRESHOLD_BPS")
    max_sync_stale_minutes: int = Field(default=720, alias="MAX_SYNC_STALE_MINUTES")
    
    # Mock data configuration
    mock_tvl: float = Field(default=1250000.0, alias="MOCK_TVL")  # $1.25M TVL
    mock_apy: float = Field(default=8.42, alias="MOCK_APY")  # 8.42% APY
    mock_share_price: float = Field(default=1.085, alias="MOCK_SHARE_PRICE")  # $1.085 per share
    mock_depositors: int = Field(default=1234, alias="MOCK_DEPOSITORS")
    
    # Monitoring
    sentry_dsn: Optional[str] = Field(default=None, alias="SENTRY_DSN")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
