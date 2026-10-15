import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import HistGradientBoostingClassifier, IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from ml.data_gen import generate_datasets

DATA_DIR = BASE_DIR / "ml" / "data"
MODELS_DIR = BASE_DIR / "ml" / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

def train_all_models():
    generate_datasets(seed=42)

    # 1. Train Failure Predictor
    df_fail = pd.read_csv(DATA_DIR / "failure_dataset.csv")
    X = df_fail[["retry_count", "latency_ewma", "external_flag", "has_fallback", "health_score"]]
    y = df_fail["failed"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    base_clf = HistGradientBoostingClassifier(random_state=42, max_iter=100)
    calibrated_clf = CalibratedClassifierCV(estimator=base_clf, method="sigmoid", cv=3)
    calibrated_clf.fit(X_train, y_train)

    joblib.dump(calibrated_clf, MODELS_DIR / "failure_predictor.joblib")
    print("Trained and saved Failure Predictor model")

    # 2. Train Anomaly Detector (Isolation Forest on baseline operational telemetry)
    X_normal = X[y == 0]
    iso = IsolationForest(contamination=0.08, random_state=42)
    iso.fit(X_normal)
    joblib.dump(iso, MODELS_DIR / "anomaly_detector.joblib")
    print("Trained and saved Anomaly Detector model")

    # 3. Train Injection Classifier
    df_inj = pd.read_csv(DATA_DIR / "injection_dataset.csv")
    X_text = df_inj["text"]
    y_inj = df_inj["label"]

    X_train_t, X_test_t, y_train_t, y_test_t = train_test_split(X_text, y_inj, test_size=0.2, random_state=42, stratify=y_inj)

    inj_pipe = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 3), max_features=1000)),
        ("lr", LogisticRegression(random_state=42))
    ])
    inj_pipe.fit(X_train_t, y_train_t)
    joblib.dump(inj_pipe, MODELS_DIR / "injection_classifier.joblib")
    print("Trained and saved Injection Classifier model")

if __name__ == "__main__":
    train_all_models()
