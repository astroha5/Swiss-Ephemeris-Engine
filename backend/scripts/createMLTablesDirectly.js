const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createMLTables() {
  console.log('Creating ML Analytics tables...');
  
  const tables = [
    {
      name: 'events',
      schema: {
        id: 'uuid DEFAULT gen_random_uuid() PRIMARY KEY',
        title: 'text NOT NULL',
        description: 'text',
        date: 'date NOT NULL',
        location: 'text',
        impact_level: 'integer DEFAULT 1',
        category: 'text',
        tags: 'text[]',
        created_at: 'timestamptz DEFAULT now()',
        updated_at: 'timestamptz DEFAULT now()'
      }
    },
    {
      name: 'ml_models',
      schema: {
        id: 'uuid DEFAULT gen_random_uuid() PRIMARY KEY',
        name: 'text NOT NULL',
        model_type: 'text NOT NULL',
        category: 'text',
        model_data: 'jsonb NOT NULL',
        training_data_count: 'integer DEFAULT 0',
        performance_metrics: 'jsonb DEFAULT \'{}\'',
        last_trained_at: 'timestamptz DEFAULT now()',
        is_active: 'boolean DEFAULT true',
        created_at: 'timestamptz DEFAULT now()',
        updated_at: 'timestamptz DEFAULT now()'
      }
    },
    {
      name: 'ml_predictions',
      schema: {
        id: 'uuid DEFAULT gen_random_uuid() PRIMARY KEY',
        model_id: 'uuid REFERENCES ml_models(id)',
        input_features: 'jsonb NOT NULL',
        predicted_risk_level: 'numeric(3,2)',
        predicted_category: 'text',
        confidence_score: 'numeric(3,2)',
        prediction_date: 'timestamptz DEFAULT now()',
        actual_outcome: 'text',
        outcome_date: 'timestamptz',
        is_validated: 'boolean DEFAULT false',
        created_at: 'timestamptz DEFAULT now()'
      }
    },
    {
      name: 'pattern_analysis_results',
      schema: {
        id: 'uuid DEFAULT gen_random_uuid() PRIMARY KEY',
        event_id: 'uuid REFERENCES events(id)',
        pattern_type: 'text NOT NULL',
        pattern_data: 'jsonb NOT NULL',
        significance_score: 'numeric(3,2)',
        date_analyzed: 'timestamptz DEFAULT now()',
        created_at: 'timestamptz DEFAULT now()'
      }
    },
    {
      name: 'ml_feature_vectors',
      schema: {
        id: 'uuid DEFAULT gen_random_uuid() PRIMARY KEY',
        event_id: 'uuid REFERENCES events(id)',
        model_id: 'uuid REFERENCES ml_models(id)',
        features: 'jsonb NOT NULL',
        target_value: 'numeric',
        created_at: 'timestamptz DEFAULT now()'
      }
    },
    {
      name: 'ml_model_performance',
      schema: {
        id: 'uuid DEFAULT gen_random_uuid() PRIMARY KEY',
        model_id: 'uuid REFERENCES ml_models(id)',
        accuracy: 'numeric(5,4)',
        precision_score: 'numeric(5,4)',
        recall: 'numeric(5,4)',
        f1_score: 'numeric(5,4)',
        drift_score: 'numeric(5,4)',
        evaluation_date: 'timestamptz DEFAULT now()',
        created_at: 'timestamptz DEFAULT now()'
      }
    },
    {
      name: 'risk_alerts',
      schema: {
        id: 'uuid DEFAULT gen_random_uuid() PRIMARY KEY',
        alert_type: 'text NOT NULL',
        risk_level: 'text NOT NULL',
        message: 'text NOT NULL',
        prediction_id: 'uuid REFERENCES ml_predictions(id)',
        is_active: 'boolean DEFAULT true',
        created_at: 'timestamptz DEFAULT now()',
        resolved_at: 'timestamptz'
      }
    }
  ];

  try {
    // Note: Supabase client doesn't support direct DDL operations
    // We need to use the REST API or SQL editor for table creation
    console.log('❌ Cannot create tables directly via Supabase client.');
    console.log('📋 Please run the following SQL commands in your Supabase SQL editor:');
    console.log('='.repeat(60));
    
    for (const table of tables) {
      const columns = Object.entries(table.schema)
        .map(([name, type]) => `  ${name} ${type}`)
        .join(',\n');
      
      console.log(`\nCREATE TABLE IF NOT EXISTS ${table.name} (\n${columns}\n);`);
    }
    
    console.log('\n-- Enable Row Level Security');
    for (const table of tables) {
      console.log(`ALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY;`);
    }
    
    console.log('\n-- Create basic RLS policies (adjust as needed)');
    for (const table of tables) {
      console.log(`CREATE POLICY "Enable read access for all users" ON ${table.name} FOR SELECT USING (true);`);
      console.log(`CREATE POLICY "Enable insert access for authenticated users" ON ${table.name} FOR INSERT WITH CHECK (true);`);
      console.log(`CREATE POLICY "Enable update access for authenticated users" ON ${table.name} FOR UPDATE USING (true);`);
    }
    
    console.log('\n-- Create indexes for better performance');
    console.log('CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);');
    console.log('CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);');
    console.log('CREATE INDEX IF NOT EXISTS idx_ml_predictions_model_id ON ml_predictions(model_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_ml_predictions_date ON ml_predictions(prediction_date);');
    console.log('CREATE INDEX IF NOT EXISTS idx_pattern_analysis_event_id ON pattern_analysis_results(event_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_ml_feature_vectors_model_id ON ml_feature_vectors(model_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_risk_alerts_active ON risk_alerts(is_active) WHERE is_active = true;');
    
    console.log('\n='.repeat(60));
    console.log('📌 Copy and paste the SQL above into your Supabase SQL editor to create the tables.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Alternative: Try to verify connection and show connection info
async function verifyConnection() {
  console.log('Verifying Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL);
  console.log('Service key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // Try a simple query that should work even without tables
    const { data, error } = await supabase.from('_supabase_migrations').select('*').limit(1);
    if (error && !error.message.includes('does not exist')) {
      console.log('❌ Connection failed:', error.message);
    } else {
      console.log('✅ Connection successful');
    }
  } catch (err) {
    console.log('Connection test result:', err.message);
  }
}

async function main() {
  await verifyConnection();
  await createMLTables();
}

main();
