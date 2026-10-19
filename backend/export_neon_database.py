"""
Universal PostgreSQL Database Exporter for Neon -> DigitalOcean
Bypasses pg_dump version mismatch restrictions by reflecting schema and copying data via psycopg2/SQLAlchemy.
Produces a standard, self-contained PostgreSQL dump (.sql) compatible with Postgres 14, 15, 16, 17, and 18.
"""
import sys
import os
import io
import datetime
from urllib.parse import urlparse
import psycopg2
from psycopg2 import sql
from sqlalchemy import create_engine, MetaData, inspect
from sqlalchemy.schema import CreateTable, CreateIndex
from sqlalchemy.dialects import postgresql

def export_database(db_url: str, output_file: str):
    print(f"Connecting to Neon database...")
    
    # 1. SQLAlchemy engine for clean DDL generation
    engine = create_engine(db_url)
    metadata = MetaData()
    print("Reflecting tables and constraints from Neon...")
    metadata.reflect(bind=engine)
    print(f"Successfully reflected {len(metadata.sorted_tables)} tables in topological order.")

    # 2. Raw psycopg2 connection for data streaming
    # Clean url for psycopg2
    p_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    conn = psycopg2.connect(p_url)
    conn.autocommit = True
    cursor = conn.cursor()

    with open(output_file, "w", encoding="utf-8") as f:
        # Header
        f.write("-- =====================================================================\n")
        f.write("-- SEYEYA COURTS - POSTGRESQL DATABASE EXPORT FROM NEON\n")
        f.write(f"-- Exported at: {datetime.datetime.utcnow().isoformat()}Z\n")
        f.write("-- Compatible with DigitalOcean Managed PostgreSQL (15, 16, 17+)\n")
        f.write("-- =====================================================================\n\n")

        f.write("SET statement_timeout = 0;\n")
        f.write("SET lock_timeout = 0;\n")
        f.write("SET client_encoding = 'UTF8';\n")
        f.write("SET standard_conforming_strings = on;\n")
        f.write("SET check_function_bodies = false;\n")
        f.write("SET client_min_messages = warning;\n")
        f.write("SET row_security = off;\n\n")

        # Disable foreign key triggers during import for seamless data loading
        f.write("-- Temporarily disable triggers/foreign keys during restore\n")
        f.write("SET session_replication_role = 'replica';\n\n")

        # Create DDL for each table
        print("Writing schema DDL...")
        pg_dialect = postgresql.dialect()
        for table in metadata.sorted_tables:
            table_name = table.name
            f.write(f"-- -------------------------------------------------------------\n")
            f.write(f"-- Table: {table_name}\n")
            f.write(f"-- -------------------------------------------------------------\n")
            f.write(f"DROP TABLE IF EXISTS \"{table_name}\" CASCADE;\n")
            
            # Compile CREATE TABLE statement with PostgreSQL dialect
            create_stmt = str(CreateTable(table).compile(dialect=pg_dialect))
            f.write(create_stmt.strip() + ";\n\n")

            # Compile indexes
            for idx in table.indexes:
                idx_stmt = str(CreateIndex(idx).compile(dialect=pg_dialect))
                f.write(idx_stmt.strip() + ";\n")
            f.write("\n")

        # Stream Table Data via COPY
        print("Streaming table data...")
        total_rows = 0
        for table in metadata.sorted_tables:
            table_name = table.name
            # Check row count
            cursor.execute(sql.SQL('SELECT count(*) FROM {}').format(sql.Identifier(table_name)))
            cnt = cursor.fetchone()[0]
            if cnt == 0:
                continue

            total_rows += cnt
            print(f"  Exporting {cnt} rows from '{table_name}'...")
            f.write(f"-- Data for table: {table_name} ({cnt} rows)\n")
            
            # Get column names
            col_names = [c.name for c in table.columns]
            cols_clause = ", ".join([f'"{c}"' for c in col_names])
            f.write(f"COPY \"{table_name}\" ({cols_clause}) FROM stdin;\n")

            # Stream COPY output to buffer
            buf = io.StringIO()
            copy_query = sql.SQL('COPY (SELECT {} FROM {}) TO STDOUT').format(
                sql.SQL(cols_clause),
                sql.Identifier(table_name)
            )
            cursor.copy_expert(copy_query, buf)
            buf.seek(0)
            f.write(buf.read())
            if not f.tell() or not buf.getvalue().endswith("\n"):
                f.write("\n")
            f.write("\\.\n\n")

        # Synchronize serial sequences so new auto-increment IDs continue correctly
        print("Exporting sequence synchronizations...")
        f.write("-- =============================================================\n")
        f.write("-- Synchronize auto-increment serial sequences\n")
        f.write("-- =============================================================\n")
        for table in metadata.sorted_tables:
            table_name = table.name
            for col in table.columns:
                is_int = False
                try:
                    is_int = issubclass(col.type.python_type, int)
                except Exception:
                    pass
                if col.primary_key and is_int:
                    col_name = col.name
                    seq_query = f"""
DO $$
DECLARE
    seq_name text;
    max_val bigint;
BEGIN
    seq_name := pg_get_serial_sequence('"{table_name}"', '{col_name}');
    IF seq_name IS NOT NULL THEN
        EXECUTE 'SELECT COALESCE(MAX("{col_name}"), 1) FROM "{table_name}"' INTO max_val;
        PERFORM setval(seq_name, max_val, true);
    END IF;
END $$;
"""
                    f.write(seq_query.strip() + "\n")

        # Re-enable foreign keys / triggers
        f.write("\n-- Re-enable triggers and foreign keys\n")
        f.write("SET session_replication_role = 'origin';\n\n")
        f.write("-- =============================================================\n")
        f.write("-- EXPORT COMPLETE\n")
        f.write("-- =============================================================\n")

    conn.close()
    file_size_kb = os.path.getsize(output_file) / 1024
    print(f"\nSUCCESS! Exported {len(metadata.sorted_tables)} tables and {total_rows} rows.")
    print(f"Dump file saved to: {output_file} ({file_size_kb:.1f} KB)")

if __name__ == "__main__":
    db_sync_url = "postgresql://neondb_owner:npg_qLkyd6hWZHg8@ep-plain-credit-ad9ex0q7.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
    dump_path = os.path.abspath("neon_dump_latest.sql")
    export_database(db_sync_url, dump_path)
