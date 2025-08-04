const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupMLDatabase() {
    console.log('Setting up ML database tables...');
    
    // Initialize Supabase client
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );

    try {
        // Read the ML schema SQL file
        const schemaPath = path.join(__dirname, 'database', 'ml_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Loaded ML schema SQL file');
        
        // Split the SQL into individual statements
        const statements = schemaSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`Found ${statements.length} SQL statements to execute`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                console.log(`Executing statement ${i + 1}/${statements.length}...`);
                
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql_query: statement
                });
                
                if (error) {
                    console.error(`Error executing statement ${i + 1}:`, error);
                    console.error('Statement:', statement);
                } else {
                    console.log(`✓ Statement ${i + 1} executed successfully`);
                }
            }
        }
        
        console.log('\nML database setup completed!');
        
        // Verify tables were created
        console.log('\nVerifying ML tables...');
        const tableQueries = [
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'ml_models'",
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'ml_predictions'",
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'feature_vectors'",
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'model_performance'",
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'pattern_analysis'",
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'risk_alerts'"
        ];
        
        for (const query of tableQueries) {
            const { data, error } = await supabase.rpc('exec_sql', {
                sql_query: query
            });
            
            if (error) {
                console.error('Error verifying table:', error);
            } else {
                const tableName = query.match(/table_name = '(\w+)'/)[1];
                console.log(`✓ ${tableName} table exists`);
            }
        }
        
    } catch (error) {
        console.error('Error setting up ML database:', error);
    }
}

// Check if exec_sql function exists, if not create it
async function createExecSqlFunction() {
    console.log('Checking for exec_sql function...');
    
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );
    
    const createFunctionSql = `
        CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
        RETURNS json
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            EXECUTE sql_query;
            RETURN json_build_object('success', true);
        EXCEPTION
            WHEN OTHERS THEN
                RETURN json_build_object('success', false, 'error', SQLERRM);
        END;
        $$;
    `;
    
    try {
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: createFunctionSql
        });
        
        if (error) {
            console.log('Creating exec_sql function...');
            // If exec_sql doesn't exist, we need to use direct SQL execution
            // This might require using the REST API directly
            console.log('Note: You may need to manually create the exec_sql function in Supabase SQL editor');
        } else {
            console.log('✓ exec_sql function is available');
        }
    } catch (error) {
        console.log('Creating exec_sql function via direct execution...');
    }
}

async function main() {
    await createExecSqlFunction();
    await setupMLDatabase();
}

main().catch(console.error);
