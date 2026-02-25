from pydantic import BaseModel


class QuestResponse(BaseModel):
    id: int
    title: str
    difficulty: str
    reward_xp: int

    class Config:
        from_attributes = True


class QuestProgressResponse(BaseModel):
    id: int
    user_id: int
    quest_id: int
    completed: bool
    score: int

    class Config:
        from_attributes = True


class QuestProgressCreate(BaseModel):
    quest_id: int
    score: int = 0
