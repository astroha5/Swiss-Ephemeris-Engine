const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    console.error('SUPABASE_URL:', !!supabaseUrl);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMLTables() {
    console.log('Creating ML tables directly...');

    try {
        // Create ml_models table
        console.log('Creating ml_models table...');
        const { error: modelsError } = await supabase.rpc('exec', {
            sql: `
            CREATE TABLE IF NOT EXISTS ml_models (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                model_name VARCHAR(255) NOT NULL,
                model_type VARCHAR(100) NOT NULL,
                category VARCHAR(100) NOT NULL,
                model_data JSONB NOT NULL,
                parameters JSONB DEFAULT '{}',
                training_data_count INTEGER DEFAULT 0,
                accuracy DECIMAL(5,4),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                last_trained TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(model_name, category)
            );
            `
        });

        if (modelsError) {
            console.log('ml_models table might already exist or using different approach...');
        }

        // Create ml_predictions table
        console.log('Creating ml_predictions table...');
        const { error: predictionsError } = await supabase.rpc('exec', {
            sql: `
            CREATE TABLE IF NOT EXISTS ml_predictions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                model_id UUID REFERENCES ml_models(id) ON DELETE CASCADE,
                model_name VARCHAR(255) NOT NULL,
                prediction_data JSONB NOT NULL,
                risk_level VARCHAR(50) NOT NULL,
                risk_score DECIMAL(5,4) NOT NULL,
                confidence DECIMAL(5,4) NOT NULL,
                location JSONB DEFAULT '{}',
                planetary_conditions JSONB DEFAULT '{}',
                prediction_date TIMESTAMPTZ DEFAULT NOW(),
                target_date TIMESTAMPTZ,
                was_accurate BOOLEAN,
                accuracy_score DECIMAL(5,4),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            `
        });

        if (predictionsError) {
            console.log('ml_predictions table creation attempted...');
        }

        // Create other tables...
        const tables = [
            {
                name: 'ml_feature_vectors',
                sql: `
                CREATE TABLE IF NOT EXISTS ml_feature_vectors (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    event_id UUID,
                    category VARCHAR(100) NOT NULL,
                    features JSONB NOT NULL,
                    impact_level VARCHAR(50),
                    impact_score DECIMAL(5,4),
                    temporal_features JSONB DEFAULT '{}',
                    planetary_features JSONB DEFAULT '{}',
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                `
            },
            {
                name: 'ml_model_performance',
                sql: `
                CREATE TABLE IF NOT EXISTS ml_model_performance (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    model_id UUID REFERENCES ml_models(id) ON DELETE CASCADE,
                    model_name VARCHAR(255) NOT NULL,
                    evaluation_date TIMESTAMPTZ DEFAULT NOW(),
                    accuracy DECIMAL(5,4) NOT NULL,
                    precision_score DECIMAL(5,4),
                    recall_score DECIMAL(5,4),
                    f1_score DECIMAL(5,4),
                    test_data_count INTEGER,
                    evaluation_metrics JSONB DEFAULT '{}',
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                `
            },
            {
                name: 'risk_alerts',
                sql: `
                CREATE TABLE IF NOT EXISTS risk_alerts (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    prediction_id UUID REFERENCES ml_predictions(id) ON DELETE CASCADE,
                    alert_type VARCHAR(100) NOT NULL,
                    risk_level VARCHAR(50) NOT NULL,
                    risk_score DECIMAL(5,4) NOT NULL,
                    message TEXT NOT NULL,
                    location JSONB DEFAULT '{}',
                    target_date TIMESTAMPTZ,
                    status VARCHAR(50) DEFAULT 'active',
                    severity VARCHAR(20) DEFAULT 'medium',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    resolved_at TIMESTAMPTZ
                );
                `
            }
        ];

        for (const table of tables) {
            console.log(`Creating ${table.name} table...`);
            const { error } = await supabase.rpc('exec', { sql: table.sql });
            if (error) {
                console.log(`${table.name} table creation attempted...`);
            }
        }

        console.log('All ML tables creation attempted!');
        
        // Try to verify tables exist by querying them
        console.log('\nVerifying tables...');
        const tableNames = ['ml_models', 'ml_predictions'];
        
        for (const tableName of tableNames) {
            try {
                const { data, error } = await supabase.from(tableName).select('*').limit(1);
                if (error) {
                    console.log(`❌ ${tableName}: ${error.message}`);
                } else {
                    console.log(`✅ ${tableName}: Table exists and accessible`);
                }
            } catch (err) {
                console.log(`❌ ${tableName}: ${err.message}`);
            }
        }

    } catch (error) {
        console.error('Error creating ML tables:', error);
    }
}

// Alternative approach - try direct table creation through Supabase management
async function alternativeCreateTables() {
    console.log('\nTrying alternative table creation...');
    
    // Create a simple test table first to see if we can create tables at all
    try {
        const { data, error } = await supabase
            .from('ml_models')
            .insert([
                {
                    model_name: 'test_model',
                    model_type: 'regression',
                    category: 'general',
                    model_data: { test: true }
                }
            ])
            .select();

        if (error && error.code === 'PGRST116') {
            console.log('Tables do not exist. You need to create them in Supabase SQL editor.');
            console.log('\nPlease go to your Supabase dashboard > SQL Editor and run the following SQL:');
            console.log('\n--- Copy and paste this SQL in Supabase SQL Editor ---');
            
            const fullSQL = `
-- ML Models table
CREATE TABLE IF NOT EXISTS ml_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(255) NOT NULL,
    model_type VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    model_data JSONB NOT NULL,
    parameters JSONB DEFAULT '{}',
    training_data_count INTEGER DEFAULT 0,
    accuracy DECIMAL(5,4),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_trained TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(model_name, category)
);

-- ML Predictions table
CREATE TABLE IF NOT EXISTS ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES ml_models(id) ON DELETE CASCADE,
    model_name VARCHAR(255) NOT NULL,
    prediction_data JSONB NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    risk_score DECIMAL(5,4) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,
    location JSONB DEFAULT '{}',
    planetary_conditions JSONB DEFAULT '{}',
    prediction_date TIMESTAMPTZ DEFAULT NOW(),
    target_date TIMESTAMPTZ,
    was_accurate BOOLEAN,
    accuracy_score DECIMAL(5,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);



-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ml_models_type ON ml_models(model_type);
CREATE INDEX IF NOT EXISTS idx_ml_models_category ON ml_models(category);
CREATE INDEX IF NOT EXISTS idx_ml_models_active ON ml_models(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ml_predictions_risk ON ml_predictions(risk_level, risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_date ON ml_predictions(created_at DESC);
`;
            
            console.log(fullSQL);
            console.log('\n--- End of SQL ---\n');
            
        } else if (error) {
            console.log('Error:', error.message);
        } else {
            console.log('✅ Tables already exist and working!');
        }
    } catch (err) {
        console.error('Error in alternative approach:', err);
    }
}

async function main() {
    await createMLTables();
    await alternativeCreateTables();
}

main();
