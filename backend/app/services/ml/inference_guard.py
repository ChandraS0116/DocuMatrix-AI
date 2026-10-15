import multiprocessing
import logging

logger = logging.getLogger(__name__)

def _worker_wrapper(func, args, kwargs, return_dict):
    try:
        return_dict['result'] = func(*args, **kwargs)
    except Exception as e:
        return_dict['error'] = str(e)

class InferenceGuard:
    def run_with_timeout(self, fn, args=(), kwargs=None, timeout_seconds=30, fallback_payload=None):
        if kwargs is None:
            kwargs = {}
            
        manager = multiprocessing.Manager()
        return_dict = manager.dict()
        
        process = multiprocessing.Process(target=_worker_wrapper, args=(fn, args, kwargs, return_dict))
        process.start()
        process.join(timeout_seconds)
        
        if process.is_alive():
            logger.error(f"InferenceGuard: Execution timed out after {timeout_seconds}s. Terminating.")
            process.terminate()
            process.join()
            return {
                "status": "failed",
                "fallback_used": True,
                "error_type": "TIMEOUT",
                "safe_output": fallback_payload or {}
            }
            
        if 'error' in return_dict:
            logger.error(f"InferenceGuard: Execution failed with error: {return_dict['error']}")
            return {
                "status": "failed",
                "fallback_used": True,
                "error_type": "INFERENCE_ERROR",
                "safe_output": fallback_payload or {}
            }
            
        return return_dict.get('result')

inference_guard = InferenceGuard()
