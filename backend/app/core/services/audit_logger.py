from sqlalchemy import event
from sqlalchemy.orm import Session, object_session
from sqlalchemy.orm.attributes import get_history
import asyncio

from ... import models, schemas
from .. import crud
from ..logging_context import current_user_var

def get_session(target_instance):
    """Gets the session from a target instance."""
    session = object_session(target_instance)
    if not session:
        # This can happen if the object is detached.
        # As a fallback, try to get the session from the context, if you have one.
        # This part is application-specific and might need a robust way to get a session.
        return None
    return session

def setup_audit_logging():
    @event.listens_for(Session, "after_flush")
    def after_flush(session, flush_context):
        user = current_user_var.get()
        if not user:
            return

        # Initialize pending logs if not present
        if 'pending_audit_logs' not in session.info:
            session.info['pending_audit_logs'] = []

        # Handle new objects
        for obj in session.new:
            if isinstance(obj, (models.Product, models.InwardLog, models.SalesLog)):
                log_entry = schemas.AuditLogCreate(
                    user_id=user.id, username=user.email, action="CREATE",
                    entity=obj.__class__.__name__, entity_id=obj.id,
                    new_value=str({c.name: getattr(obj, c.name) for c in obj.__table__.columns if c.name != 'id'})
                )
                session.info['pending_audit_logs'].append(log_entry)

        # Handle updated objects
        for obj in session.dirty:
            if isinstance(obj, (models.Product, models.InwardLog, models.SalesLog)):
                for attr in obj.__mapper__.attrs:
                    history = get_history(obj, attr.key)
                    if history.has_changes():
                        log_entry = schemas.AuditLogCreate(
                            user_id=user.id, username=user.email, action="UPDATE",
                            entity=obj.__class__.__name__, entity_id=obj.id,
                            field_changed=attr.key,
                            old_value=str(history.deleted[0]) if history.deleted else None,
                            new_value=str(history.added[0]) if history.added else None,
                        )
                        session.info['pending_audit_logs'].append(log_entry)
        
        # Handle deleted objects
        for obj in session.deleted:
            if isinstance(obj, (models.Product, models.InwardLog, models.SalesLog)):
                log_entry = schemas.AuditLogCreate(
                    user_id=user.id, username=user.email, action="DELETE",
                    entity=obj.__class__.__name__, entity_id=obj.id,
                    old_value=str({c.name: getattr(obj, c.name) for c in obj.__table__.columns if c.name != 'id'})
                )
                session.info['pending_audit_logs'].append(log_entry)

    @event.listens_for(Session, "before_commit")
    def before_commit(session):
        if session.info.get('pending_audit_logs'):
            for log_entry in session.info['pending_audit_logs']:
                db_log = models.AuditLog(**log_entry.model_dump())
                session.add(db_log)
            session.info['pending_audit_logs'] = []

@event.listens_for(models.Product, 'after_insert')
@event.listens_for(models.InwardLog, 'after_insert')
@event.listens_for(models.SalesLog, 'after_insert')
def after_insert_listener(mapper, connection, target):
    user = current_user_var.get()
    if not user: return

    session = get_session(target)
    if not session: return

    log_entry = schemas.AuditLogCreate(
        user_id=user.id,
        username=user.email,
        action="CREATE",
        entity=target.__class__.__name__,
        entity_id=target.id,
        new_value=str({c.name: getattr(target, c.name) for c in target.__table__.columns})
    )
    # Since this is an async app, we cannot call await here.
    # This is a major challenge with SQLAlchemy events in async.
    # A common pattern is to dispatch these to a background task or a separate sync worker.
    # For simplicity, we will try to run this in a nested event loop if possible,
    # but this is not recommended for production.
    # A better solution might be to collect changes and log them at the end of the request.
    # Let's assume a sync function for now and address async challenge later.
    # crud.audit_log.create_audit_log(session, log_entry) - This needs to be async.

@event.listens_for(models.Product, 'after_update')
@event.listens_for(models.InwardLog, 'after_update')
@event.listens_for(models.SalesLog, 'after_update')
def after_update_listener(mapper, connection, target):
    user = current_user_var.get()
    if not user: return

    session = get_session(target)
    if not session: return
    
    for attr in target.__mapper__.attrs:
        history = get_history(target, attr.key)
        if history.has_changes():
            log_entry = schemas.AuditLogCreate(
                user_id=user.id,
                username=user.email,
                action="UPDATE",
                entity=target.__class__.__name__,
                entity_id=target.id,
                field_changed=attr.key,
                old_value=str(history.deleted[0]) if history.deleted else None,
                new_value=str(history.added[0]) if history.added else None,
            )
            # Same async challenge as above
            # crud.audit_log.create_audit_log(session, log_entry)

@event.listens_for(models.Product, 'before_delete')
@event.listens_for(models.InwardLog, 'before_delete')
@event.listens_for(models.SalesLog, 'before_delete')
def before_delete_listener(mapper, connection, target):
    user = current_user_var.get()
    if not user: return

    session = get_session(target)
    if not session: return

    log_entry = schemas.AuditLogCreate(
        user_id=user.id,
        username=user.email,
        action="DELETE",
        entity=target.__class__.__name__,
        entity_id=target.id,
        old_value=str({c.name: getattr(target, c.name) for c in target.__table__.columns})
    )
    # Same async challenge as above
    # crud.audit_log.create_audit_log(session, log_entry) 