class ShadowSink:
    def store(self, result, metrics):
        self._write_to_shadow_store(result)
        self._emit_shadow_telemetry(metrics)
        
    def _write_to_shadow_store(self, result):
        pass
        
    def _emit_shadow_telemetry(self, metrics):
        pass

shadow_sink = ShadowSink()
