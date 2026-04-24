"""
Lot 2: Train XGBoost pricing model on synthetic data.

This module will train a gradient-boosted model to predict insurance premiums
based on customer profile features (age, location, coverage type, claims
history, credit score, etc.).

Dependencies (Lot 2):
    pip install pandas xgboost scikit-learn joblib
"""

# import pandas as pd
# import xgboost as xgb
# from sklearn.model_selection import train_test_split
# from sklearn.metrics import mean_absolute_error
# import joblib


def load_data(path: str = "data/synthetic_pricing.csv"):
    """Load and preprocess the synthetic pricing dataset.

    Args:
        path: Path to the CSV training data.

    Returns:
        Tuple of (features_df, target_series).
    """
    # TODO: Lot 2 implementation
    # df = pd.read_csv(path)
    # X = df.drop(columns=["premium"])
    # y = df["premium"]
    # return X, y
    raise NotImplementedError("Lot 2: pricing model training not yet implemented")


def train_model(X, y, params: dict | None = None):
    """Train an XGBoost regressor on the pricing data.

    Args:
        X: Feature matrix.
        y: Target premiums.
        params: Optional XGBoost hyperparameters.

    Returns:
        Trained XGBoost model.
    """
    # TODO: Lot 2 implementation
    # X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2)
    # model = xgb.XGBRegressor(**(params or {}))
    # model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
    # mae = mean_absolute_error(y_val, model.predict(X_val))
    # print(f"Validation MAE: {mae:.2f}")
    # return model
    raise NotImplementedError("Lot 2: pricing model training not yet implemented")


def save_model(model, path: str = "models/pricing/model.joblib"):
    """Serialize the trained model to disk.

    Args:
        model: Trained XGBoost model.
        path: Output path for the serialized model.
    """
    # TODO: Lot 2 implementation
    # joblib.dump(model, path)
    # print(f"Model saved to {path}")
    raise NotImplementedError("Lot 2: pricing model saving not yet implemented")


def main():
    """End-to-end training pipeline."""
    print("Lot 2: Pricing model training pipeline")
    print("This is a stub — implementation pending Lot 2 delivery.")

    # X, y = load_data()
    # model = train_model(X, y)
    # save_model(model)


if __name__ == "__main__":
    main()
