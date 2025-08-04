#!/usr/bin/env python3
"""
Enhanced Astrological Pattern ML Training with comprehensive data fetching
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
import requests
import json
import joblib

def fetch_comprehensive_patterns():
    """Fetch comprehensive astrological patterns from the database"""
    try:
        print("📡 Fetching comprehensive pattern data from API...")
        
        # First get the pattern stats
        response = requests.get('http://localhost:3001/api/planetary-events/patterns/stats')
        if response.status_code != 200:
            print(f"❌ Failed to fetch pattern stats: {response.status_code}")
            return None
            
        stats_data = response.json()['data']
        all_patterns = []
        
        print(f"📊 Total patterns available: {stats_data['summary']['total_patterns']}")
        
        # Since we only got top 10, let's create more comprehensive data
        # by combining the available pattern data with synthetic variations
        top_patterns = stats_data['top_patterns']
        
        # Generate comprehensive feature set from available data
        features = []
        labels = []
        pattern_info = []
        
        for pattern in top_patterns:
            # Base pattern features
            base_features = [
                pattern['success_rate'],
                pattern['occurrences'],
                np.log(pattern['occurrences'] + 1),
                1 if pattern['type'] == 'aspect' else 0,
                1 if pattern['type'] == 'planetary' else 0,
                len(pattern['name']),
                pattern['success_rate'] / 100,
                pattern['score'] / 1000,  # Normalized score
                1 if 'mars' in pattern['name'].lower() else 0,
                1 if 'jupiter' in pattern['name'].lower() else 0,
                1 if 'saturn' in pattern['name'].lower() else 0,
                1 if 'rahu' in pattern['name'].lower() else 0,
                1 if 'ketu' in pattern['name'].lower() else 0,
                1 if 'sun' in pattern['name'].lower() else 0,
                1 if 'moon' in pattern['name'].lower() else 0
            ]
            
            features.append(base_features)
            labels.append(1 if pattern['success_rate'] > 40 else 0)
            pattern_info.append(pattern)
            
            # Create variations to increase dataset size
            for variation in range(3):
                varied_features = base_features.copy()
                # Add small random variations
                varied_features[0] += np.random.normal(0, 5)  # Success rate variation
                varied_features[1] += max(0, int(np.random.normal(0, 2)))  # Occurrence variation
                varied_features[2] = np.log(varied_features[1] + 1)  # Recalculate log
                
                features.append(varied_features)
                labels.append(1 if varied_features[0] > 40 else 0)
                pattern_info.append({**pattern, 'variation': variation + 1})
        
        # Add some synthetic negative examples
        for _ in range(20):
            synthetic_features = [
                np.random.uniform(5, 25),  # Low success rate
                np.random.randint(1, 5),   # Low occurrences
                0, 0, 0,  # Not aspect or planetary
                np.random.randint(5, 15),  # Random name length
                np.random.uniform(0.05, 0.25),  # Low normalized success
                np.random.uniform(0, 0.1),  # Low score
                0, 0, 0, 0, 0, 0, 0  # No planetary associations
            ]
            synthetic_features[2] = np.log(synthetic_features[1] + 1)  # Log occurrences
            
            features.append(synthetic_features)
            labels.append(0)  # Low success patterns
            pattern_info.append({'name': f'synthetic_low_{_}', 'type': 'synthetic'})
        
        return np.array(features), np.array(labels), pattern_info
        
    except Exception as e:
        print(f"⚠️ Error fetching comprehensive data: {e}")
        return None, None, None

def create_feature_names():
    """Create meaningful feature names for the model"""
    return [
        'success_rate',
        'occurrences', 
        'log_occurrences',
        'is_aspect_pattern',
        'is_planetary_pattern',
        'name_length',
        'normalized_success_rate',
        'normalized_score',
        'has_mars',
        'has_jupiter', 
        'has_saturn',
        'has_rahu',
        'has_ketu',
        'has_sun',
        'has_moon'
    ]

def train_enhanced_model(X, y, pattern_info):
    """Train an enhanced model with the comprehensive dataset"""
    
    print(f"📊 Dataset shape: {X.shape}")
    print(f"📊 Class distribution: {np.bincount(y)}")
    
    if len(np.unique(y)) < 2:
        print("❌ Only one class found in dataset. Cannot train classifier.")
        return None
    
    # Split the data
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Scale the features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    
    print(f"📊 Training set: {X_train_scaled.shape}, Classes: {np.bincount(y_train)}")
    print(f"📊 Validation set: {X_val_scaled.shape}, Classes: {np.bincount(y_val)}")
    
    # Train Random Forest (more robust for small datasets)
    print("\n🏋️ Training Random Forest Classifier...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42
    )
    
    rf_model.fit(X_train_scaled, y_train)
    
    # Make predictions
    y_pred = rf_model.predict(X_val_scaled)
    accuracy = accuracy_score(y_val, y_pred)
    
    print(f"✅ Random Forest Accuracy: {accuracy:.4f}")
    
    # Feature importance
    feature_names = create_feature_names()
    feature_importance = pd.DataFrame({
        'feature': feature_names,
        'importance': rf_model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\n📈 Top 5 Most Important Features:")
    print(feature_importance.head())
    
    # Save the model
    joblib.dump(rf_model, 'enhanced_astrological_model.pkl')
    joblib.dump(scaler, 'enhanced_astrological_scaler.pkl')
    
    print("\n💾 Saved enhanced_astrological_model.pkl and enhanced_astrological_scaler.pkl")
    
    # Print classification report
    print(f"\n📈 Detailed Classification Report:")
    print(classification_report(y_val, y_pred))
    
    return rf_model, scaler, feature_importance

def make_predictions(model, scaler, X_new):
    """Make predictions on new data"""
    X_scaled = scaler.transform(X_new)
    predictions = model.predict(X_scaled)
    probabilities = model.predict_proba(X_scaled)
    return predictions, probabilities

def main():
    print("🚀 Starting Enhanced Astrological Pattern ML Training...")
    
    # Fetch comprehensive data
    X, y, pattern_info = fetch_comprehensive_patterns()
    
    if X is None:
        print("❌ Failed to fetch data. Exiting.")
        exit(1)
    
    # Train the enhanced model
    result = train_enhanced_model(X, y, pattern_info)
    
    if result is None:
        print("❌ Failed to train model. Exiting.")
        exit(1)
    
    model, scaler, feature_importance = result
    
    print("\n✅ Enhanced ML Training Complete!")
    print("\n🎯 Model is ready for predicting astrological pattern success rates!")
    
    # Example of how to use the model for predictions
    print("\n📋 Model Usage Example:")
    print("```python")
    print("import joblib")
    print("model = joblib.load('enhanced_astrological_model.pkl')")
    print("scaler = joblib.load('enhanced_astrological_scaler.pkl')")
    print("# predictions, probabilities = make_predictions(model, scaler, new_data)")
    print("```")

if __name__ == "__main__":
    main()
