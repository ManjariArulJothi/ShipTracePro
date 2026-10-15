import re
import math
from collections import Counter

# Intent Categories
CATEGORIES = ["LOST_PACKAGE", "DELIVERY_DELAY", "DAMAGED_PARCEL", "PAYMENT_BILLING", "GENERAL_INQUIRY"]

# Category Keywords & Probabilities
CATEGORY_VOCAB = {
    "LOST_PACKAGE": ["lost", "missing", "where", "delivered", "doorstep", "not received", "disappeared", "locate", "tracking stopped", "stolen", "never"],
    "DELIVERY_DELAY": ["delay", "delayed", "late", "stuck", "transit", "when", "expedite", "slow", "postponed", "eta", "waiting", "expected", "hours"],
    "DAMAGED_PARCEL": ["damaged", "broken", "crushed", "torn", "box", "leaking", "ruined", "destroyed", "replacement", "tampered", "opened", "seal"],
    "PAYMENT_BILLING": ["payment", "charge", "charged", "billing", "invoice", "refund", "receipt", "gst", "fee", "cod", "price", "discrepancy", "money"],
    "GENERAL_INQUIRY": ["how", "address", "phone", "contact", "driver", "window", "change", "update", "question", "service", "timing", "weekend", "rules"]
}

URGENT_KEYWORDS = [
    "urgent", "emergency", "medicine", "medical", "hospital", "critical",
    "legal", "passport", "immediately", "broken", "stolen", "perishable", "asap"
]

HIGH_KEYWORDS = [
    "delayed", "stuck", "missing", "refund", "damaged", "today", "tomorrow"
]

class TicketNlpClassifier:
    """
    Pure Python & NumPy NLP Intent Classifier and Urgency Detection
    (No Scipy/C-extensions required).
    """

    def _tokenize(self, text: str):
        text = text.lower()
        words = re.findall(r"\b[a-z]{2,}\b", text)
        # Bigrams
        bigrams = [f"{words[i]} {words[i+1]}" for i in range(len(words)-1)]
        return words + bigrams

    def classify(self, subject: str, description: str):
        full_text = f"{subject} {description}".strip()
        tokens = self._tokenize(full_text)
        token_set = set(tokens)

        # Score categories based on TF-IDF style term frequency
        scores = {}
        for cat, kw_list in CATEGORY_VOCAB.items():
            matches = sum(1.5 if " " in kw else 1.0 for kw in kw_list if kw in token_set or any(kw in t for t in tokens))
            scores[cat] = matches + 0.1  # Laplace smoothing

        total_score = sum(scores.values())
        probs = {cat: round(scores[cat] / total_score, 2) for cat in scores}

        predicted_category = max(probs, key=probs.get)
        confidence = probs[predicted_category]

        # Urgency & Priority Detection
        text_lower = full_text.lower()
        is_urgent = any(kw in text_lower for kw in URGENT_KEYWORDS)
        is_high = any(kw in text_lower for kw in HIGH_KEYWORDS)

        if is_urgent:
            suggested_priority = "URGENT"
            urgency_score = 0.95
        elif is_high or predicted_category in ["DAMAGED_PARCEL", "LOST_PACKAGE"]:
            suggested_priority = "HIGH"
            urgency_score = 0.75
        elif predicted_category == "DELIVERY_DELAY":
            suggested_priority = "MEDIUM"
            urgency_score = 0.50
        else:
            suggested_priority = "LOW"
            urgency_score = 0.25

        # Sentiment estimation
        negative_words = ["terrible", "bad", "worst", "broken", "angry", "crushed", "lost", "delay", "poor", "pathetic"]
        neg_count = sum(1 for w in negative_words if w in text_lower)
        sentiment = "NEGATIVE" if neg_count >= 1 else "NEUTRAL"
        if any(w in text_lower for w in ["thank", "good", "please", "kindly"]):
            sentiment = "NEUTRAL" if neg_count == 0 else "MIXED"

        return {
            "predicted_category": predicted_category,
            "confidence": confidence,
            "category_probabilities": probs,
            "suggested_priority": suggested_priority,
            "urgency_score": urgency_score,
            "detected_sentiment": sentiment,
            "auto_assigned_department": "OPERATIONS_ESCALATION" if suggested_priority in ["URGENT", "HIGH"] else "CUSTOMER_CARE"
        }
