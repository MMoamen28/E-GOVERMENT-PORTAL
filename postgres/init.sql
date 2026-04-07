SELECT 'CREATE DATABASE gorules_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'gorules_db')\gexec
