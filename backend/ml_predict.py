#!/usr/bin/env python3
"""
ML Prediction Service for Astrological Patterns
This script can be called from Node.js to make predictions using trained models
"""

import sys
import json
import numpy as np
import joblib
import os
from pathlib import Path

def load_model(model_name='enhanced_astrological_model'):
    """Load the trained model and scaler"""
    try:
        current_dir = Path(__file__).parent
        model_path = current_dir / f"{model_name}.pkl"
        scaler_path = current_dir / "enhanced_astrological_scaler.pkl"
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        if not scaler_path.exists():
            raise FileNotFoundError(f"Scaler file not found: {scaler_path}")
        
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        
        return model, scaler
    
    except Exception as e:
        return None, None, str(e)

def make_prediction(features, model_name='enhanced_astrological_model'):
    """Make a prediction using the trained model"""
    try:
        # Load model and scaler
        model, scaler = load_model(model_name)
        
        if model is None or scaler is None:
            return {
                'success': False,
                'error': 'Failed to load model or scaler'
            }
        
        # Convert features to numpy array
        features_array = np.array(features).reshape(1, -1)
        
        # Scale features
        features_scaled = scaler.transform(features_array)
        
        # Make prediction
        prediction = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0].tolist()
        
        # Get feature importance if available
        feature_importance = None
        if hasattr(model, 'feature_importances_'):
            feature_importance = model.feature_importances_.tolist()
        
        return {
            'success': True,
            'prediction': int(prediction),
            'probabilities': probabilities,
            'confidence': max(probabilities),
            'feature_importance': feature_importance,
            'model_used': model_name,
            'features_processed': len(features)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def predict_astrological_pattern_success(pattern_data):
    """
    Predict if an astrological pattern will be successful
    Expected pattern_data format:
    {
        'success_rate': float,
        'occurrences': int,
        'score': float,
        'is_aspect_pattern': bool,
        'is_planetary_pattern': bool,
        'name_length': int,
        'has_mars': bool,
        'has_jupiter': bool,
        'has_saturn': bool,
        'has_rahu': bool,
        'has_ketu': bool,
        'has_sun': bool,
        'has_moon': bool
    }
    """
    try:
        # Convert pattern data to feature vector
        features = [
            pattern_data.get('success_rate', 0),
            pattern_data.get('occurrences', 0),
            np.log(pattern_data.get('occurrences', 0) + 1),
            1 if pattern_data.get('is_aspect_pattern', False) else 0,
            1 if pattern_data.get('is_planetary_pattern', False) else 0,
            pattern_data.get('name_length', 0),
            pattern_data.get('success_rate', 0) / 100,
            pattern_data.get('score', 0) / 1000,
            1 if pattern_data.get('has_mars', False) else 0,
            1 if pattern_data.get('has_jupiter', False) else 0,
            1 if pattern_data.get('has_saturn', False) else 0,
            1 if pattern_data.get('has_rahu', False) else 0,
            1 if pattern_data.get('has_ketu', False) else 0,
            1 if pattern_data.get('has_sun', False) else 0,
            1 if pattern_data.get('has_moon', False) else 0
        ]
        
        return make_prediction(features)
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Error processing pattern data: {str(e)}'
        }

def get_model_info():
    """Get information about available models"""
    try:
        current_dir = Path(__file__).parent
        model_files = list(current_dir.glob("*.pkl"))
        
        models = []
        for model_file in model_files:
            try:
                # Get file stats
                stats = model_file.stat()
                
                # Try to load and get basic info
                if 'scaler' not in model_file.name:
                    try:
                        model = joblib.load(model_file)
                        model_info = {
                            'filename': model_file.name,
                            'size': stats.st_size,
                            'modified': stats.st_mtime,
                            'type': type(model).__name__,
                            'has_feature_importance': hasattr(model, 'feature_importances_'),
                            'has_predict_proba': hasattr(model, 'predict_proba')
                        }
                        models.append(model_info)
                    except:
                        models.append({
                            'filename': model_file.name,
                            'size': stats.st_size,
                            'modified': stats.st_mtime,
                            'type': 'unknown',
                            'error': 'Could not load model'
                        })
            except Exception as e:
                models.append({
                    'filename': model_file.name,
                    'error': str(e)
                })
        
        return {
            'success': True,
            'models': models,
            'total_models': len(models)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'No command provided. Use: predict, pattern-predict, or model-info'
        }))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'predict':
        if len(sys.argv) < 3:
            print(json.dumps({
                'success': False,
                'error': 'Features required for prediction'
            }))
            sys.exit(1)
        
        # Parse features from command line
        try:
            features = json.loads(sys.argv[2])
            model_name = sys.argv[3] if len(sys.argv) > 3 else 'enhanced_astrological_model'
            result = make_prediction(features, model_name)
            print(json.dumps(result))
        except json.JSONDecodeError:
            print(json.dumps({
                'success': False,
                'error': 'Invalid JSON format for features'
            }))
    
    elif command == 'pattern-predict':
        if len(sys.argv) < 3:
            print(json.dumps({
                'success': False,
                'error': 'Pattern data required for prediction'
            }))
            sys.exit(1)
        
        try:
            pattern_data = json.loads(sys.argv[2])
            result = predict_astrological_pattern_success(pattern_data)
            print(json.dumps(result))
        except json.JSONDecodeError:
            print(json.dumps({
                'success': False,
                'error': 'Invalid JSON format for pattern data'
            }))
    
    elif command == 'model-info':
        result = get_model_info()
        print(json.dumps(result))
    
    else:
        print(json.dumps({
            'success': False,
            'error': f'Unknown command: {command}. Use: predict, pattern-predict, or model-info'
        }))

if __name__ == "__main__":
    main()
