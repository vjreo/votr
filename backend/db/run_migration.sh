#!/bin/bash

# Simple script to run SQL migration file directly via psql
# This avoids Node.js parsing issues

cd "$(dirname "$0")"

echo "Running migration for missing tables..."
echo ""

/usr/local/opt/postgresql@15/bin/psql votr -f migrations/002_create_missing_tables.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed!"
    echo ""
    echo "Verifying tables..."
    /usr/local/opt/postgresql@15/bin/psql votr -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name IN ('candidates', 'candidate_sources', 'elections', 'swipes') ORDER BY table_name;"
else
    echo ""
    echo "❌ Migration failed!"
    exit 1
fi
