"""add pending_orders table

Revision ID: e7805cfe87d1
Revises: 9a30eb1e092e
Create Date: 2025-06-30 16:18:06.836476

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7805cfe87d1'
down_revision: Union[str, None] = '9a30eb1e092e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'pending_orders',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('product_id', sa.Integer, nullable=False),
        sa.Column('date', sa.Date, nullable=False),
        sa.Column('colour_code', sa.Integer, nullable=True),
        sa.Column('color', sa.String, nullable=True),
        sa.Column('sizes', sa.JSON, nullable=True),
        sa.Column('agency_name', sa.String, nullable=True),
        sa.Column('store_name', sa.String, nullable=True),
        sa.Column('operation', sa.String, nullable=True),
        sa.Column('order_number', sa.Integer, nullable=False),
        sa.Column('financial_year', sa.String, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=True),
        sa.Column('updated_at', sa.DateTime, nullable=True),
        sa.UniqueConstraint('order_number', 'financial_year', name='uq_pending_order_number_finyear'),
    )


def downgrade() -> None:
    op.drop_table('pending_orders')
