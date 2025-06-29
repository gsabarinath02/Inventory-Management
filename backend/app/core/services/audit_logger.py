from sqlalchemy import event
from sqlalchemy.orm import Session, object_session
from sqlalchemy.orm.attributes import get_history
import json
import datetime
import enum

from ... import models, schemas
from ..logging_context import current_user_var

# Add all models to tracked models
TRACKED_MODELS = (
    models.Product, 
    models.InwardLog, 
    models.SalesLog, 
    models.User, 
    models.ProductColorStock,
    models.Order,
    models.Customer,
    models.Agency
)

def get_session(target_instance):
    """Gets the session from a target instance."""
    session = object_session(target_instance)
    if not session:
        # This can happen if the object is detached.
        # As a fallback, try to get the session from the context, if you have one.
        # This part is application-specific and might need a robust way to get a session.
        return None
    return session

def model_to_dict(obj):
    """Serialize a SQLAlchemy model instance to a JSON-serializable dict."""
    result = {}
    for c in obj.__table__.columns:
        value = getattr(obj, c.name)
        if isinstance(value, enum.Enum):
            value = value.value
        elif isinstance(value, (datetime.datetime, datetime.date)):
            value = value.isoformat()
        result[c.name] = value
    return result

def safe_json(val):
    if val is None:
        return None
    if isinstance(val, (dict, list, int, float, bool)):
        return json.dumps(val)
    try:
        # Try to parse as JSON
        return json.dumps(json.loads(val))
    except Exception:
        return json.dumps(str(val))

def setup_audit_logging():
    @event.listens_for(Session, "after_flush")
    def after_flush(session, flush_context):
        user = current_user_var.get()
        
        # Debug: print what is being seen
        print("[AUDIT] session.new:", [type(obj).__name__ for obj in session.new])
        print("[AUDIT] session.dirty:", [type(obj).__name__ for obj in session.dirty])
        print("[AUDIT] session.deleted:", [type(obj).__name__ for obj in session.deleted])
        for obj in session.deleted:
            try:
                print(f"[AUDIT-DETAIL] Deleted: {type(obj).__name__} (ID: {getattr(obj, 'id', None)})")
            except Exception as e:
                print(f"[AUDIT-DETAIL] Error printing deleted object: {e}")

        # Initialize pending logs if not present
        if 'pending_audit_logs' not in session.info:
            session.info['pending_audit_logs'] = []

        # Handle new objects
        for obj in session.new:
            if isinstance(obj, TRACKED_MODELS):
                log_entry = schemas.AuditLogCreate(
                    user_id=user.id if user else None,
                    username=user.email if user else "system",
                    action="CREATE",
                    entity=obj.__class__.__name__, 
                    entity_id=obj.id,
                    new_value=json.dumps(model_to_dict(obj))
                )
                session.info['pending_audit_logs'].append(log_entry)

        # Handle updated objects
        for obj in session.dirty:
            if isinstance(obj, TRACKED_MODELS):
                for attr in obj.__mapper__.attrs:
                    history = get_history(obj, attr.key)
                    if history.has_changes():
                        old_val = history.deleted[0] if history.deleted else None
                        new_val = history.added[0] if history.added else None
                        # Serialize enums/dates
                        if isinstance(old_val, enum.Enum):
                            old_val = old_val.value
                        if isinstance(new_val, enum.Enum):
                            new_val = new_val.value
                        if isinstance(old_val, (datetime.datetime, datetime.date)):
                            old_val = old_val.isoformat()
                        if isinstance(new_val, (datetime.datetime, datetime.date)):
                            new_val = new_val.isoformat()
                        log_entry = schemas.AuditLogCreate(
                            user_id=user.id if user else None,
                            username=user.email if user else "system",
                            action="UPDATE",
                            entity=obj.__class__.__name__, 
                            entity_id=obj.id,
                            field_changed=attr.key,
                            old_value=safe_json(old_val),
                            new_value=safe_json(new_val),
                        )
                        session.info['pending_audit_logs'].append(log_entry)
        
        # Handle deleted objects
        for obj in session.deleted:
            if isinstance(obj, TRACKED_MODELS):
                log_entry = schemas.AuditLogCreate(
                    user_id=user.id if user else None,
                    username=user.email if user else "system",
                    action="DELETE",
                    entity=obj.__class__.__name__, 
                    entity_id=obj.id,
                    old_value=json.dumps(model_to_dict(obj))
                )
                session.info['pending_audit_logs'].append(log_entry)

    @event.listens_for(Session, "before_commit")
    def before_commit(session):
        if session.info.get('pending_audit_logs'):
            for log_entry in session.info['pending_audit_logs']:
                db_log = models.AuditLog(**log_entry.model_dump())
                session.add(db_log)
            session.info['pending_audit_logs'] = []

    # Add listeners for all tracked models
    @event.listens_for(models.Product, 'before_delete')
    @event.listens_for(models.InwardLog, 'before_delete')
    @event.listens_for(models.SalesLog, 'before_delete')
    @event.listens_for(models.User, 'before_delete')
    @event.listens_for(models.ProductColorStock, 'before_delete')
    @event.listens_for(models.Order, 'before_delete')
    @event.listens_for(models.Customer, 'before_delete')
    @event.listens_for(models.Agency, 'before_delete')
    def before_delete_listener(mapper, connection, target):
        user = current_user_var.get()
        session = object_session(target)
        if not session:
            return
        log_entry = schemas.AuditLogCreate(
            user_id=user.id if user else None,
            username=user.email if user else "system",
            action="DELETE",
            entity=target.__class__.__name__,
            entity_id=target.id,
            old_value=json.dumps(model_to_dict(target))
        )
        db_log = models.AuditLog(**log_entry.model_dump())
        session.add(db_log) 