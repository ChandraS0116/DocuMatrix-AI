from app.services.autonomy.pipeline_controller import StructuredPipelineDecision, PipelineAction
from app.services.autonomy.execution_graph import ExecutionGraph, GraphNode

class GraphBuilder:
    def build(self, decision: StructuredPipelineDecision, document_id: str) -> ExecutionGraph:
        graph = ExecutionGraph(document_id=document_id)
        
        retries = decision.retry_policy.max_retries if decision.retry_policy else 3
        
        if decision.action == PipelineAction.OCR_REPROCESS_ENHANCED:
            n1 = GraphNode(name="Enhanced_OCR", action=PipelineAction.OCR_REPROCESS_ENHANCED, max_retries=retries, inputs=decision.parameters)
            n2 = GraphNode(name="Classification", action=PipelineAction.PROCEED_TO_CLASSIFICATION, max_retries=retries)
            n3 = GraphNode(name="Extraction", action=PipelineAction.PROCEED_TO_EXTRACTION, max_retries=retries)
            n4 = GraphNode(name="Validation", action=PipelineAction.PROCEED_TO_VALIDATION, max_retries=retries)
            n5 = GraphNode(name="Indexing", action=PipelineAction.PROCEED_TO_INDEXING, max_retries=retries)
            graph.add_node(n1)
            graph.add_node(n2)
            graph.add_node(n3)
            graph.add_node(n4)
            graph.add_node(n5)
            graph.add_edge(n1.node_id, n2.node_id)
            graph.add_edge(n2.node_id, n3.node_id)
            graph.add_edge(n3.node_id, n4.node_id)
            graph.add_edge(n4.node_id, n5.node_id)
            
        elif decision.action == PipelineAction.CLASSIFY_USING_ML_STRONG_MODEL:
            n1 = GraphNode(name="Strong_Classification", action=PipelineAction.CLASSIFY_USING_ML_STRONG_MODEL, max_retries=retries, inputs=decision.parameters)
            n2 = GraphNode(name="Extraction", action=PipelineAction.PROCEED_TO_EXTRACTION, max_retries=retries)
            n3 = GraphNode(name="Validation", action=PipelineAction.PROCEED_TO_VALIDATION, max_retries=retries)
            n4 = GraphNode(name="Indexing", action=PipelineAction.PROCEED_TO_INDEXING, max_retries=retries)
            graph.add_node(n1)
            graph.add_node(n2)
            graph.add_node(n3)
            graph.add_node(n4)
            graph.add_edge(n1.node_id, n2.node_id)
            graph.add_edge(n2.node_id, n3.node_id)
            graph.add_edge(n3.node_id, n4.node_id)
            
        elif decision.action == PipelineAction.SEND_TO_HITL_PRIORITY:
            n1 = GraphNode(name="HITL_Escalation", action=PipelineAction.SEND_TO_HITL_PRIORITY, max_retries=0)
            graph.add_node(n1)
            
        elif decision.action == PipelineAction.PROCEED_TO_CLASSIFICATION:
            n1 = GraphNode(name="Classification", action=PipelineAction.PROCEED_TO_CLASSIFICATION, max_retries=retries)
            n2 = GraphNode(name="Extraction", action=PipelineAction.PROCEED_TO_EXTRACTION, max_retries=retries)
            n3 = GraphNode(name="Validation", action=PipelineAction.PROCEED_TO_VALIDATION, max_retries=retries)
            n4 = GraphNode(name="Indexing", action=PipelineAction.PROCEED_TO_INDEXING, max_retries=retries)
            graph.add_node(n1)
            graph.add_node(n2)
            graph.add_node(n3)
            graph.add_node(n4)
            graph.add_edge(n1.node_id, n2.node_id)
            graph.add_edge(n2.node_id, n3.node_id)
            graph.add_edge(n3.node_id, n4.node_id)
            
        else:
            # Fallback linear graph based on the single action
            n1 = GraphNode(name=str(decision.action.value), action=decision.action, max_retries=retries, inputs=decision.parameters)
            graph.add_node(n1)
            
        return graph

graph_builder = GraphBuilder()
