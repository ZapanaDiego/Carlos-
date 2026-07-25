import os
import json
import traceback
from datetime import datetime, timezone
from . import logger

def generate_crash_dump(exception, snapshot=None):
    """
    Generates a crash dump JSON file containing traceback and recent logs.
    Never writes to stdout.
    """
    dump_dir = "logs/crash_dumps"
    os.makedirs(dump_dir, exist_ok=True)
    
    timestamp = datetime.now(timezone.utc).isoformat(timespec='milliseconds')
    safe_filename = timestamp.replace(":", "-").replace(".", "-")
    dump_path = os.path.join(dump_dir, f"crash_{safe_filename}.json")
    
    tb = "".join(traceback.format_exception(type(exception), exception, exception.__traceback__))
    
    dump_data = {
        "timestamp": timestamp,
        "error": str(exception),
        "traceback": tb,
        "recent_logs": logger.get_recent_logs(),
        "interpreter_snapshot": snapshot
    }
    
    try:
        with open(dump_path, "w", encoding="utf-8") as f:
            json.dump(dump_data, f, indent=2)
        logger.fatal(f"Crash dump generated at {dump_path}", source="python.engine.crash")
    except Exception as e:
        logger.fatal(f"Failed to generate crash dump: {str(e)}", source="python.engine.crash")
