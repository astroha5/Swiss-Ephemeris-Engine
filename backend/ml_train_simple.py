#!/usr/bin/env python3
"""
Simplified Astrological Pattern ML Training using scikit-learn
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import cross_val_score
import requests
import json
import joblib

def fetch_patterns_from_db():
    """Fetch astrological patterns from the database via API"""
    try:
        print("📡 Fetching pattern data from API...")
        response = requests.get('http://localhost:3001/api/planetary-events/patterns/stats')
        if response.status_code == 200:
            data = response.json()
            patterns = data['data']['top_patterns']
            
            print(f"✅ Found {len(patterns)} patterns")
            
            # Convert to features and labels
            features = []
            labels = []
            
            for pattern in patterns:
                # Create feature vector from pattern data
                feature_vector = [
                    pattern['success_rate'],
                    pattern['occurrences'],
                    pattern['score'],
                    1 if pattern['type'] == 'aspect' else 0,
                    1 if pattern['type'] == 'planetary' else 0,
                    len(pattern['name']),  # Name length as a feature
                    pattern['success_rate'] / 100,  # Normalized success rate
                    np.log(pattern['occurrences'] + 1),  # Log occurrences
                    pattern['occurrences'] / pattern['success_rate'] if pattern['success_rate'] > 0 else 0,
                    1 if pattern['success_rate'] > 50 else 0  # High success flag
                ]
                features.append(feature_vector)
                
                # Label: 1 if high success rate (>30%), 0 otherwise
                labels.append(1 if pattern['success_rate'] > 30 else 0)
            
            return np.array(features), np.array(labels)
        else:
            print(f"❌ Failed to fetch data: {response.status_code}")
            return None, None
    except Exception as e:
        print(f"⚠️ Error fetching data: {e}")
        # Fallback to simulated data
        return fetch_simulated_data()

def fetch_simulated_data():
    """Fallback function to generate simulated data"""
    print("🔄 Using simulated data...")
    num_samples = 1000
    num_features = 10
    X = np.random.rand(num_samples, num_features)
    y = np.random.randint(2, size=num_samples)
    return X, y

def preprocess_data(X, y):
    """Preprocess the data for training"""
    if X is None or y is None:
        return None, None, None, None
        
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    X_train, X_val, y_train, y_val = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
    return X_train, X_val, y_train, y_val, scaler

def train_models(X_train, y_train, X_val, y_val):
    """Train multiple models and compare performance"""
    models = {
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
        'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, random_state=42),
        'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000)
    }
    
    results = {}
    
    for name, model in models.items():
        print(f"\n🏋️ Training {name}...")
        
        # Train the model
        model.fit(X_train, y_train)
        
        # Make predictions
        y_pred = model.predict(X_val)
        
        # Calculate metrics
        accuracy = accuracy_score(y_val, y_pred)
        cv_scores = cross_val_score(model, X_train, y_train, cv=5)
        
        results[name] = {
            'model': model,
            'accuracy': accuracy,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'predictions': y_pred
        }
        
        print(f"✅ {name} - Validation Accuracy: {accuracy:.4f}")
        print(f"📊 Cross-validation: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
    
    return results

def save_best_model(results, scaler):
    """Save the best performing model"""
    best_model_name = max(results.keys(), key=lambda k: results[k]['accuracy'])
    best_model = results[best_model_name]['model']
    
    print(f"\n🏆 Best model: {best_model_name} with accuracy {results[best_model_name]['accuracy']:.4f}")
    
    # Save the model and scaler
    joblib.dump(best_model, 'best_astrological_model.pkl')
    joblib.dump(scaler, 'astrological_scaler.pkl')
    
    print("💾 Saved best_astrological_model.pkl and astrological_scaler.pkl")
    
    return best_model_name, best_model

def main():
    print("🚀 Starting Astrological Pattern ML Training (Simple Version)...")
    
    # Fetch and preprocess data
    X, y = fetch_patterns_from_db()
    if X is None or y is None:
        print("❌ Failed to fetch data. Exiting.")
        exit(1)
        
    result = preprocess_data(X, y)
    if result[0] is None:
        print("❌ Failed to preprocess data. Exiting.")
        exit(1)
    
    X_train, X_val, y_train, y_val, scaler = result
    
    print(f"📊 Training data shape: {X_train.shape}")
    print(f"📊 Validation data shape: {X_val.shape}")
    print(f"📊 Class distribution: {np.bincount(y)}")
    
    # Train models
    results = train_models(X_train, y_train, X_val, y_val)
    
    # Save best model
    best_name, best_model = save_best_model(results, scaler)
    
    # Print detailed results for best model
    print(f"\n📈 Detailed results for {best_name}:")
    print(classification_report(y_val, results[best_name]['predictions']))
    
    print("\n✅ Training complete!")

if __name__ == "__main__":
    main()
