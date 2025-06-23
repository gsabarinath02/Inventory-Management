from contextvars import ContextVar
from typing import Optional
from .. import schemas

current_user_var: ContextVar[Optional[schemas.User]] = ContextVar("current_user_var", default=None) 