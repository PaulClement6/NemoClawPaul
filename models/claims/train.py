"""
Lot 2: Train claims severity classification model on synthetic data.

This module will train a classifier to predict claims severity levels
(low, medium, high, critical) based on claim features (type, amount,
description embeddings, adjuster notes, etc.).

Dependencies (Lot 2):
    pip install pandas xgboost scikit-learn joblib
"""

# import pandas as pd
# import xgboost as xgb
# from sklearn.model_selection import train_test_split
# from sklearn.metrics import classification_report
# import joblib


def load_data(path: str = "data/synthetic_claims.csv"):
    """Load and preprocess the synthetic claims dataset.

    Args:
        path: Path to the CSV training data.

    Returns:
        Tuple of (features_df, target_series).
    """
    # TODO: Lot 2 implementation
    # df = pd.read_csv(path)
    # X = df.drop(columns=["severity"])
    # y = df["severity"]
    # return X, y
    raise NotImplementedError("Lot 2: claims model training not yet implemented")


def train_model(X, y, params: dict | None = None):
    """Train an XGBoost classifier on the claims data.

    Args:
        X: Feature matrix.
        y: Target severity labels.
        params: Optional XGBoost hyperparameters.

    Returns:
        Trained XGBoost classifier.
    """
    # TODO: Lot 2 implementation
    # X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2)
    # model = xgb.XGBClassifier(**(params or {}))
    # model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
    # print(classification_report(y_val, model.predict(X_val)))
    # return model
    raise NotImplementedError("Lot 2: claims model training not yet implemented")


def save_model(model, path: str = "models/claims/model.joblib"):
    """Serialize the trained model to disk.

    Args:
        model: Trained XGBoost classifier.
        path: Output path for the serialized model.
    """
    # TODO: Lot 2 implementation
    # joblib.dump(model, path)
    # print(f"Model saved to {path}")
    raise NotImplementedError("Lot 2: claims model saving not yet implemented")


def main():
    """End-to-end training pipeline."""
    print("Lot 2: Claims severity classification training pipeline")
    print("This is a stub — implementation pending Lot 2 delivery.")

    # X, y = load_data()
    # model = train_model(X, y)
    # save_model(model)


if __name__ == "__main__":
    main()
