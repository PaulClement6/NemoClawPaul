"""
Lot 2: Serve pricing model via Flask REST API.

Exposes the trained XGBoost pricing model as a REST endpoint
that the NemoClaw pricing agent can call through its sandbox policy.

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
    # model = joblib.load("models/pricing/model.joblib")
    #
    # @app.route("/api/v1/pricing/score", methods=["POST"])
    # def score():
    #     """Score a pricing request.
    #
    #     Expects JSON body with customer features:
    #         {
    #             "age": 35,
    #             "location": "CA",
    #             "coverage_type": "comprehensive",
    #             "claims_history": 1,
    #             "credit_score": 720
    #         }
    #
    #     Returns:
    #         {
    #             "predicted_premium": 1250.00,
    #             "confidence": 0.87,
    #             "model_version": "v1.0"
    #         }
    #     """
    #     data = request.get_json()
    #     features = pd.DataFrame([data])
    #     prediction = model.predict(features)[0]
    #     return jsonify({
    #         "predicted_premium": round(float(prediction), 2),
    #         "confidence": 0.0,  # TODO: compute prediction interval
    #         "model_version": "v1.0"
    #     })
    #
    # return app
    raise NotImplementedError("Lot 2: pricing model serving not yet implemented")


if __name__ == "__main__":
    print("Lot 2: Pricing model server")
    print("This is a stub — implementation pending Lot 2 delivery.")
    # app = create_app()
    # app.run(host="0.0.0.0", port=5001)
