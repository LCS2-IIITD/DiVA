"""Added Diffusion model Table

Revision ID: 977d1f63dcc8
Revises: 23867006d7e3
Create Date: 2020-09-28 19:11:45.253442

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '977d1f63dcc8'
down_revision = '23867006d7e3'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('diffusion_model',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('label', sa.String(length=10), nullable=True),
    sa.Column('iteration', sa.JSON(), nullable=True),
    sa.Column('seeds', sa.JSON(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_diffusion_model_label'), 'diffusion_model', ['label'], unique=True)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_diffusion_model_label'), table_name='diffusion_model')
    op.drop_table('diffusion_model')
    # ### end Alembic commands ###
