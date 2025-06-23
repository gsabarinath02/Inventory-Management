from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta
from app.config import settings
from app.database import AsyncSessionLocal
from app.core.crud.audit_log import delete_old_audit_logs
import asyncio

scheduler = AsyncIOScheduler()

def start_scheduler():
    scheduler.start()

async def auto_delete_old_audit_logs():
    async with AsyncSessionLocal() as db:
        retention_days = settings.ACTIVITY_LOG_RETENTION_DAYS
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        deleted_count = await delete_old_audit_logs(db, cutoff_date)
        if deleted_count:
            print(f"[Scheduler] Deleted {deleted_count} old audit logs older than {retention_days} days.")

# Schedule the job to run daily at 2:00 AM
scheduler.add_job(lambda: asyncio.create_task(auto_delete_old_audit_logs()), 'cron', hour=2, minute=0) 