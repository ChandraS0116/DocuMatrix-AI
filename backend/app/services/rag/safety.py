class RagSafetyLayer:
    @staticmethod
    def sanitize_context(chunk_text: str) -> str:
        # Strip potentially malicious prompt instructions injected into document text
        malicious_phrases = ["ignore previous instructions", "system prompt", "you are a bot"]
        sanitized = chunk_text
        lower_text = chunk_text.lower()
        for phrase in malicious_phrases:
            if phrase in lower_text:
                # Basic neutralization
                sanitized = sanitized.replace(phrase, "[REDACTED]")
                sanitized = sanitized.replace(phrase.upper(), "[REDACTED]")
                sanitized = sanitized.replace(phrase.capitalize(), "[REDACTED]")
        return sanitized
        
    @staticmethod
    def wrap_trusted_context(chunk_text: str, chunk_id: str) -> str:
        sanitized = RagSafetyLayer.sanitize_context(chunk_text)
        # Explicitly tag as system-generated OCR data
        return f"<TRUSTED_CONTEXT source='{chunk_id}' trusted_source='true'>\n{sanitized}\n</TRUSTED_CONTEXT>"
