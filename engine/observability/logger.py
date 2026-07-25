import os
import sys
import json
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime, timezone
from collections import deque

# Global circular buffer for crash dumps
_log_buffer = deque(maxlen=50)

# Global simulation step
_current_simulation_step = None

class JsonStderrHandler(logging.StreamHandler):
    def __init__(self):
        super().__init__(sys.stderr)

    def emit(self, record):
        try:
            msg = self.format(record)
            stream = self.stream
            stream.write(msg + self.terminator)
            self.flush()
        except Exception:
            self.handleError(record)


class JsonFormatter(logging.Formatter):
    def format(self, record):
        # Extract custom fields from record
        metadata = getattr(record, 'metadata', {})
        source = getattr(record, 'source', record.name)
        sim_step = getattr(record, 'simulation_step', _current_simulation_step)

        # Map Python logging levels to our schema
        level_map = {
            logging.DEBUG: "DEBUG",
            logging.INFO: "INFO",
            logging.WARNING: "WARN",
            logging.ERROR: "ERROR",
            logging.CRITICAL: "FATAL"
        }
        # Python's logging doesn't have TRACE natively, we'll map logging.NOTSET+5 to TRACE
        level_name = level_map.get(record.levelno, "INFO")
        if record.levelno == 5:
            level_name = "TRACE"

        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(timespec='milliseconds'),
            "level": level_name,
            "source": source,
            "message": record.getMessage(),
            "metadata": metadata,
            "simulation_step": sim_step
        }
        
        # Save to circular buffer
        _log_buffer.append(log_entry)
        
        return json.dumps(log_entry)

def set_simulation_step(step: int):
    global _current_simulation_step
    _current_simulation_step = step

def get_recent_logs():
    return list(_log_buffer)

# Configure logger
logger = logging.getLogger("carlospp")

# Add TRACE level (5)
TRACE_LEVEL = 5
logging.addLevelName(TRACE_LEVEL, "TRACE")

def init_logger(log_file=None):
    logger.handlers.clear()
    
    # Do not silently default without logging it later
    raw_env = os.environ.get("CARLOSPP_ENV")
    env = (raw_env or "prod").lower()
    
    if env == "dev":
        active_level = TRACE_LEVEL
        active_level_name = "TRACE"
    else:
        active_level = logging.INFO
        active_level_name = "INFO"
        
    logger.setLevel(active_level)
    logger.propagate = False
    
    formatter = JsonFormatter()
    
    # Stderr handler
    stderr_handler = JsonStderrHandler()
    stderr_handler.setFormatter(formatter)
    logger.addHandler(stderr_handler)
    
    # File handler
    if log_file:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        file_handler = RotatingFileHandler(
            log_file, maxBytes=5*1024*1024, backupCount=3
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        
    # Explicitly log the environment and verbosity on startup
    info(f"Logger initialized. Environment: {env} (raw: {raw_env}). Verbosity: {active_level_name}.", source="python.logger")

def trace(msg, source="python.engine", **metadata):
    logger.log(TRACE_LEVEL, msg, extra={"source": source, "metadata": metadata})

def debug(msg, source="python.engine", **metadata):
    logger.debug(msg, extra={"source": source, "metadata": metadata})

def info(msg, source="python.engine", **metadata):
    logger.info(msg, extra={"source": source, "metadata": metadata})

def warn(msg, source="python.engine", **metadata):
    logger.warning(msg, extra={"source": source, "metadata": metadata})

def error(msg, source="python.engine", **metadata):
    logger.error(msg, extra={"source": source, "metadata": metadata})

def fatal(msg, source="python.engine", **metadata):
    logger.critical(msg, extra={"source": source, "metadata": metadata})
