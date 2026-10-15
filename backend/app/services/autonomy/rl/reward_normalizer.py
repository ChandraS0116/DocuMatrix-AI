class RewardNormalizer:
    def __init__(self):
        self.history = []
        
    def normalize(self, raw_reward: float) -> float:
        self.history.append(raw_reward)
        if len(self.history) > 1000:
            self.history.pop(0)
            
        if len(self.history) < 2:
            mean = 0.0
            std = 1.0
        else:
            mean = sum(self.history) / len(self.history)
            variance = sum((x - mean) ** 2 for x in self.history) / len(self.history)
            std = max(0.1, variance ** 0.5)
            
        norm = (raw_reward - mean) / std
        return max(-5.0, min(5.0, norm))

reward_normalizer = RewardNormalizer()
