from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from ...database import get_db
from ...api.deps import require_admin
from ...core.crud.agency import (
    create_agency, get_agency, get_agencies, update_agency, 
    delete_agency, get_agency_names, get_agency_by_name
)
from ...core.crud.audit_log import create_audit_log
from ...schemas.agency import Agency, AgencyCreate, AgencyUpdate
from ...schemas.audit_log import AuditLogCreate

router = APIRouter()

@router.post("/", response_model=Agency)
async def create_new_agency(
    agency: AgencyCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Create a new agency (Admin only)."""
    # Check if agency name already exists
    existing_agency = await get_agency_by_name(db, agency.agency_name)
    if existing_agency:
        raise HTTPException(status_code=400, detail="Agency name already exists")
    
    created_agency = await create_agency(db, agency)
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            username=current_user.email,
            action="CREATE",
            entity="Agency",
            entity_id=created_agency.id,
            field_changed="agency",
            new_value=f"Created agency: {created_agency.agency_name}"
        )
    )
    return created_agency

@router.get("/", response_model=List[Agency])
async def read_agencies(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Get all agencies with pagination and search (Admin only)."""
    agencies = await get_agencies(db, skip=skip, limit=limit, search=search)
    return agencies

@router.get("/names", response_model=List[str])
async def read_agency_names(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Get all agency names for dropdown (Admin only)."""
    return await get_agency_names(db)

@router.get("/{agency_id}", response_model=Agency)
async def read_agency(
    agency_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Get a specific agency by ID (Admin only)."""
    agency = await get_agency(db, agency_id)
    if agency is None:
        raise HTTPException(status_code=404, detail="Agency not found")
    return agency

@router.put("/{agency_id}", response_model=Agency)
async def update_existing_agency(
    agency_id: int,
    agency_update: AgencyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Update an agency (Admin only)."""
    # Check if agency exists
    existing_agency = await get_agency(db, agency_id)
    if existing_agency is None:
        raise HTTPException(status_code=404, detail="Agency not found")
    
    # If agency name is being updated, check for duplicates
    if agency_update.agency_name:
        duplicate_agency = await get_agency_by_name(db, agency_update.agency_name)
        if duplicate_agency and duplicate_agency.id != agency_id:
            raise HTTPException(status_code=400, detail="Agency name already exists")
    
    updated_agency = await update_agency(db, agency_id, agency_update)
    if updated_agency is None:
        raise HTTPException(status_code=404, detail="Agency not found")
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            username=current_user.email,
            action="UPDATE",
            entity="Agency",
            entity_id=agency_id,
            field_changed="agency",
            old_value=f"Old: {existing_agency.agency_name}",
            new_value=f"Updated: {updated_agency.agency_name}"
        )
    )
    return updated_agency

@router.delete("/{agency_id}")
async def delete_existing_agency(
    agency_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Delete an agency (Admin only)."""
    # Check if agency exists
    existing_agency = await get_agency(db, agency_id)
    if existing_agency is None:
        raise HTTPException(status_code=404, detail="Agency not found")
    
    success = await delete_agency(db, agency_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete agency")
    
    await create_audit_log(
        db,
        AuditLogCreate(
            user_id=current_user.id,
            username=current_user.email,
            action="DELETE",
            entity="Agency",
            entity_id=agency_id,
            field_changed="agency",
            old_value=f"Deleted agency: {existing_agency.agency_name}",
            new_value=None
        )
    )
    return {"message": "Agency deleted successfully"} 