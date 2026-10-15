from enum import Enum
from pydantic import BaseModel, Field
from typing import Dict, List, Any
from app.services.autonomy.pipeline_controller import PipelineAction
import uuid

class NodeStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class NodeState(BaseModel):
    status: NodeStatus
    retries: int = 0
    error: str = ""

class GraphNode(BaseModel):
    node_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    action: PipelineAction
    inputs: Dict[str, Any] = Field(default_factory=dict)
    outputs: Dict[str, Any] = Field(default_factory=dict)
    status: NodeStatus = NodeStatus.PENDING
    retry_count: int = 0
    max_retries: int = 3
    error_log: str = ""

class ExecutionGraph(BaseModel):
    graph_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_id: str
    nodes: Dict[str, GraphNode] = Field(default_factory=dict)
    edges: Dict[str, List[str]] = Field(default_factory=dict)
    state: Dict[str, NodeState] = Field(default_factory=dict)
    
    def add_node(self, node: GraphNode):
        self.nodes[node.node_id] = node
        if node.node_id not in self.edges:
            self.edges[node.node_id] = []
        self.state[node.node_id] = NodeState(status=node.status, retries=node.retry_count)
        
    def add_edge(self, from_node_id: str, to_node_id: str):
        if from_node_id in self.edges:
            self.edges[from_node_id].append(to_node_id)
            
    def is_complete(self) -> bool:
        return all(state.status in [NodeStatus.COMPLETED, NodeStatus.FAILED] for state in self.state.values())
        
    def get_next_ready_node(self) -> GraphNode:
        parents = {n: [] for n in self.nodes}
        for from_n, to_list in self.edges.items():
            for to_n in to_list:
                parents[to_n].append(from_n)
                
        for node_id, node in self.nodes.items():
            if self.state[node_id].status == NodeStatus.PENDING:
                if all(self.state[p].status == NodeStatus.COMPLETED for p in parents[node_id]):
                    return node
        return None
        
    def mark_complete(self, node: GraphNode, result: dict):
        node.status = NodeStatus.COMPLETED
        node.outputs = result or {}
        self.state[node.node_id].status = NodeStatus.COMPLETED
        
    def mark_failed(self, node: GraphNode):
        node.status = NodeStatus.FAILED
        self.state[node.node_id].status = NodeStatus.FAILED
