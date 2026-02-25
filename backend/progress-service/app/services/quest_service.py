from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.quest import Quest, QuestProgress
from app.schemas.quest import QuestProgressCreate


class QuestService:
    @staticmethod
    def get_all_quests(db: Session) -> list[Quest]:
        return db.query(Quest).all()

    @staticmethod
    def get_quest_by_id(db: Session, quest_id: int) -> Quest:
        quest = db.query(Quest).filter(Quest.id == quest_id).first()
        if not quest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quest not found"
            )
        return quest

    @staticmethod
    def get_user_quest_progress(db: Session, user_id: int) -> list[QuestProgress]:
        return db.query(QuestProgress).filter(QuestProgress.user_id == user_id).all()

    @staticmethod
    def create_or_update_quest_progress(
        db: Session,
        user_id: int,
        progress_data: QuestProgressCreate
    ) -> QuestProgress:
        QuestService.get_quest_by_id(db, progress_data.quest_id)

        existing_progress = db.query(QuestProgress).filter(
            QuestProgress.user_id == user_id,
            QuestProgress.quest_id == progress_data.quest_id
        ).first()

        if existing_progress:
            if existing_progress.completed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Quest already completed"
                )
            existing_progress.score = progress_data.score
            existing_progress.completed = True
            db.commit()
            db.refresh(existing_progress)
            return existing_progress
        else:
            new_progress = QuestProgress(
                user_id=user_id,
                quest_id=progress_data.quest_id,
                score=progress_data.score,
                completed=True
            )
            db.add(new_progress)
            db.commit()
            db.refresh(new_progress)
            return new_progress
