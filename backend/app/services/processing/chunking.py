from typing import List, Dict, Any

def structure_aware_chunking(canonical_document: dict) -> List[Dict[str, Any]]:
    """
    Chunks a canonical document based on physical structure (pages, blocks, tables)
    rather than naive token limits.
    """
    chunks = []
    chunk_index = 0
    
    pages = canonical_document.get("pages", [])
    for page in pages:
        page_num = page.get("page_number", 1)
        
        current_chunk_blocks = []
        current_chunk_text = ""
        
        blocks = page.get("blocks", [])
        for block in blocks:
            # Isolate tables perfectly
            if block.get("block_type") == "table":
                if current_chunk_blocks:
                    chunks.append({
                        "chunk_index": chunk_index,
                        "page_number": page_num,
                        "source_type": "text",
                        "block_ids": [b.get("id") for b in current_chunk_blocks if b.get("id")],
                        "text": current_chunk_text.strip()
                    })
                    chunk_index += 1
                    current_chunk_blocks = []
                    current_chunk_text = ""
                    
                table_text = " ".join([l.get("text", "") for l in block.get("lines", [])])
                chunks.append({
                    "chunk_index": chunk_index,
                    "page_number": page_num,
                    "source_type": "table",
                    "block_ids": [block.get("id")] if block.get("id") else [],
                    "text": table_text.strip()
                })
                chunk_index += 1
                continue
                
            current_chunk_blocks.append(block)
            block_text = " ".join([l.get("text", "") for l in block.get("lines", [])])
            current_chunk_text += block_text + " "
            
            # Group up to 3 blocks
            if len(current_chunk_blocks) >= 3:
                chunks.append({
                    "chunk_index": chunk_index,
                    "page_number": page_num,
                    "source_type": "text",
                    "block_ids": [b.get("id") for b in current_chunk_blocks if b.get("id")],
                    "text": current_chunk_text.strip()
                })
                chunk_index += 1
                current_chunk_blocks = []
                current_chunk_text = ""
                
        if current_chunk_blocks:
            chunks.append({
                "chunk_index": chunk_index,
                "page_number": page_num,
                "source_type": "text",
                "block_ids": [b.get("id") for b in current_chunk_blocks if b.get("id")],
                "text": current_chunk_text.strip()
            })
            chunk_index += 1
            
    return chunks
