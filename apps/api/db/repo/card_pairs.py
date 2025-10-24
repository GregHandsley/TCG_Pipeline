from sqlalchemy import select, update
from db.core import SessionLocal
from models.card_pair import CardPair

def set_status_and_id(pair_id: str, status: str, id_json: dict | None):
    with SessionLocal() as db:
        q = select(CardPair).where(CardPair.id == pair_id)
        row = db.execute(q).scalar_one_or_none()
        if not row:
            return False
        db.execute(
            update(CardPair)
            .where(CardPair.id == pair_id)
            .values(status=status, id_json=id_json)
        )
        db.commit()
        return True