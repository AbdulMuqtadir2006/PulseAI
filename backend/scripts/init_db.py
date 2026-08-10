"""Creates the Postgres schema. The app also runs this on startup, but this
script lets you (re)initialize the DB explicitly."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import config, db  # noqa: E402

if __name__ == "__main__":
    db.init_schema()
    print(f"Schema ready at {config.DATABASE_URL}")
