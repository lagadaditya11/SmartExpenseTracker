from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    color_hex: str = Field(default="#64748b", pattern=r"^#[0-9a-fA-F]{6}$")
    icon: str = Field(default="circle", min_length=1, max_length=50)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    color_hex: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    icon: str | None = Field(default=None, min_length=1, max_length=50)


class CategoryRead(CategoryBase):
    id: int

    model_config = {"from_attributes": True}
