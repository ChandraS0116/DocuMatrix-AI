import hashlib
import json

class ExecutionLock:
    def __init__(self, system_mode_provider):
        self.system_mode_provider = system_mode_provider

    def assert_immutable_graph(self, execution_graph):
        system_mode = self.system_mode_provider.get_mode()

        if system_mode == "PRODUCTION":
            current_hash = self.compute_hash(execution_graph)
            if hasattr(execution_graph, "graph_hash") and execution_graph.graph_hash:
                if execution_graph.graph_hash != current_hash:
                    raise RuntimeError("DAG_MUTATION_BLOCKED: Execution graph is immutable in PRODUCTION mode")
            
            execution_graph.graph_hash = current_hash

        return True

    def compute_hash(self, graph):
        graph_dict = graph.to_dict() if hasattr(graph, "to_dict") else vars(graph)
        return hashlib.sha256(
            json.dumps(graph_dict, sort_keys=True, default=str).encode("utf-8")
        ).hexdigest()
