import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import requests
import json

def fetch_patterns_from_db():
    """Fetch astrological patterns from the database via API"""
    try:
        # Get pattern statistics from the API
        response = requests.get('http://localhost:3001/api/planetary-events/patterns/stats')
        if response.status_code == 200:
            data = response.json()
            patterns = data['data']['top_patterns']
            
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
            print(f"Failed to fetch data: {response.status_code}")
            return None, None
    except Exception as e:
        print(f"Error fetching data: {e}")
        # Fallback to simulated data
        return fetch_simulated_data()

def fetch_simulated_data():
    """Fallback function to generate simulated data"""
    print("Using simulated data...")
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
    return X_train, X_val, y_train, y_val

def build_model(input_shape):
    """Build the neural network model"""
    model = Sequential([
        Dense(128, activation='relu', input_shape=input_shape),
        Dropout(0.2),
        Dense(64, activation='relu'),
        Dropout(0.2),
        Dense(32, activation='relu'),
        Dense(1, activation='sigmoid')  # Binary classification
    ])
    return model

if __name__ == "__main__":
    print("🚀 Starting Astrological Pattern ML Training...")
    
    # Fetch and preprocess data
    X, y = fetch_patterns_from_db()
    if X is None or y is None:
        print("❌ Failed to fetch data. Exiting.")
        exit(1)
        
    X_train, X_val, y_train, y_val = preprocess_data(X, y)
    if X_train is None:
        print("❌ Failed to preprocess data. Exiting.")
        exit(1)
    
    print(f"📊 Training data shape: {X_train.shape}")
    print(f"📊 Validation data shape: {X_val.shape}")
    
    # Build and compile the model
    input_shape = (X_train.shape[1],)
    model = build_model(input_shape)
    
    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=['accuracy']
    )
    
    print("🏗️ Model architecture:")
    model.summary()
    
    print("\n🎯 Starting training...")
    # Train the model
    history = model.fit(
        X_train, y_train,
        epochs=50,
        batch_size=16,
        validation_data=(X_val, y_val),
        verbose=1
    )
    
    # Evaluate the model
    val_loss, val_accuracy = model.evaluate(X_val, y_val, verbose=0)
    print(f"\n✅ Training complete!")
    print(f"📈 Validation Accuracy: {val_accuracy:.4f}")
    print(f"📉 Validation Loss: {val_loss:.4f}")
    
    # Save the model
    model.save('astrological_patterns_model.h5')
    print("💾 Model saved as 'astrological_patterns_model.h5'")
