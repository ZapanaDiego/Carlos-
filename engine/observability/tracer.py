import functools
import time
from . import logger

def trace_execution(source="python.engine.tracer"):
    """
    Decorator to trace function entry and exit.
    Logs execution time and arguments (sanitized).
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Very basic sanitization, stringifying args and taking substring
            # to avoid logging huge objects.
            safe_args = [str(a)[:100] for a in args]
            safe_kwargs = {k: str(v)[:100] for k, v in kwargs.items()}
            
            logger.trace(f"Entering {func.__name__}", source=source, 
                         function_name=func.__name__, args=safe_args, kwargs=safe_kwargs)
            
            start_time = time.perf_counter()
            try:
                result = func(*args, **kwargs)
                duration = time.perf_counter() - start_time
                logger.trace(f"Exiting {func.__name__}", source=source, 
                             function_name=func.__name__, duration_ms=duration * 1000)
                return result
            except Exception as e:
                duration = time.perf_counter() - start_time
                logger.error(f"Exception in {func.__name__}: {str(e)}", source=source, 
                             function_name=func.__name__, duration_ms=duration * 1000, error=str(e))
                raise
        return wrapper
    return decorator
