
from fastapi import FastAPI
import joblib
from pydantic import BaseModel
import os
from fastapi.middleware.cors import CORSMiddleware  # <--- Add this line

origins = [
    "https://focus-analyzer-ai-6.onrender.com",  # Your Frontend URL
    "https://focus-analyzer-ai-4.onrender.com" # Your Node Backend URL
]


class SessionFeatures(BaseModel):
    duration: float
    switch_count: int
    switch_rate: float
    active_ratio: float

app = FastAPI()
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
model = joblib.load(MODEL_PATH)


app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True)

@app.post("/predict")
def predict(data: SessionFeatures):
    features = [[
        data.duration,
        data.switch_count,
        data.switch_rate,
        data.active_ratio
    ]]

    prediction = int(model.predict(features)[0])
    probability = float(model.predict_proba(features).max())

    return {
        "prediction": prediction,        # 0 or 1
        "confidence": probability        # 0.0 – 1.0
    }



