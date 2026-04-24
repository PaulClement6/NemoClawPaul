"""
Lot 2: Serve claims severity model via Flask REST API.

Exposes the trained XGBoost classifier as a REST endpoint
that the NemoClaw claims analyst agent can call through its sandbox policy.

Dependencies (Lot 2):
    pip install flask joblib xgboost pandas
"""

# from flask import Flask, request, jsonify
# import joblib
# import pandas as pd

# app = Flask(__name__)
# model = None


def create_app():
    """Create and configure the Flask application."""
    # TODO: Lot 2 implementation
    # global model
    # app = Flask(__name__)
    # model = joblib.load("models/claims/model.joblib")
    #
    # @app.route("/api/v1/claims/predict", methods=["POST"])
    # def predict():
    #     """Predict claims severity.
    #
    #     Expects JSON body with claim features:
    #         {
    #             "claim_type": "auto",
    #             "amount": 15000,
    #             "description": "Rear-end collision on highway",
    #             "adjuster_score": 0.72
    #         }
    #
    #     Returns:
    #         {
    #             "severity": "medium",
    #             "confidence": 0.85,
    #             "probabilities": {
    #                 "low": 0.05,
    #                 "medium": 0.85,
    #                 "high": 0.08,
    #                 "critical": 0.02
    #             },
    #             "model_version": "v1.0"
    #         }
    #     """
    #     data = request.get_json()
    #     features = pd.DataFrame([data])
    #     prediction = model.predict(features)[0]
    #     probabilities = model.predict_proba(features)[0]
    #     labels = ["low", "medium", "high", "critical"]
    #     return jsonify({
    #         "severity": labels[prediction],
    #         "confidence": round(float(max(probabilities)), 2),
    #         "probabilities": {
    #             l: round(float(p), 2) for l, p in zip(labels, probabilities)
    #         },
    #         "model_version": "v1.0"
    #     })
    #
    # return app
    raise NotImplementedError("Lot 2: claims model serving not yet implemented")


if __name__ == "__main__":
    print("Lot 2: Claims severity model server")
    print("This is a stub — implementation pending Lot 2 delivery.")
    # app = create_app()
    # app.run(host="0.0.0.0", port=5002)
