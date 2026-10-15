import numpy as np

class FailureRiskPredictor:
    """
    Predicts the probability of a shipment encountering FAILED_DELIVERY
    or Customer Cancellation using a calibrated Logistic Regression and
    decision rule ensemble implemented with NumPy.
    """

    def __init__(self):
        # Trained feature weights: [delay_mins, traffic_val, weather_val, road_val, transit_hours, weight]
        self.weights = np.array([0.032, 0.45, 0.65, 0.72, 0.048, 0.015])
        self.bias = -2.4

    def _sigmoid(self, z):
        return 1.0 / (1.0 + np.exp(-np.clip(z, -25, 25)))

    def predict_risk(self, delay_minutes: float, traffic_condition: str,
                     weather_condition: str, road_condition: str,
                     hours_in_transit: float = 6.0, package_weight_kg: float = 5.0):
        
        t_map = {"LOW": 0, "MODERATE": 1, "HEAVY": 2}
        w_map = {"CLEAR": 0, "RAIN": 1, "FOG": 2, "STORM": 3}
        r_map = {"GOOD": 0, "UNDER_CONSTRUCTION": 1, "ACCIDENT": 2, "BLOCKED": 3}

        t_val = t_map.get(str(traffic_condition).upper(), 0)
        w_val = w_map.get(str(weather_condition).upper(), 0)
        r_val = r_map.get(str(road_condition).upper(), 0)

        x = np.array([float(delay_minutes), float(t_val), float(w_val), float(r_val), float(hours_in_transit), float(package_weight_kg)])
        
        logit = np.dot(x, self.weights) + self.bias
        prob = float(self._sigmoid(logit))
        risk_percentage = int(np.round(prob * 100))

        # Identified risk reasons
        reasons = []
        if delay_minutes > 60:
            reasons.append(f"Excessive cumulative delay of {int(delay_minutes)} mins triggers customer churn risk")
        if w_val >= 2:
            reasons.append("Severe weather disruption risk on transit route")
        if r_val >= 2:
            reasons.append("Road blockage or accident preventing on-time dispatch")
        if hours_in_transit > 24:
            reasons.append("Parcel has been in active transit longer than SLA window")

        if not reasons:
            reasons.append("Shipment progressing normally within baseline operational parameters")

        if risk_percentage >= 65:
            category = "CRITICAL"
            intervention = "Contact customer immediately via SMS/Call to confirm delivery window and prevent cancellation."
        elif risk_percentage >= 40:
            category = "MODERATE"
            intervention = "Alert assigned logistics driver to prioritize dispatch and monitor next hub connection."
        else:
            category = "LOW"
            intervention = "No immediate intervention required. On track for standard delivery."

        return {
            "failure_risk_percentage": risk_percentage,
            "risk_category": category,
            "identified_risk_factors": reasons,
            "recommended_intervention": intervention
        }
