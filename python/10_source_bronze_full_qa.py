#!/usr/bin/env python3
"""Compare original Directo-style CSVs in ZIP archives with PostgreSQL bronze tables.

Read-only. Does not write to PostgreSQL. Exports results locally as CSV.
"""
import argparse
import csv
import getpass
import io
import os
import sys
import zipfile
from collections import Counter
from pathlib import Path

ACTUAL = ('invoice_header', 'invoice_rows', 'item', 'object',
          'production_header', 'production_rows', 'purchase_header', 'purchase_rows')
BUDGET = ('production_budget', 'sales_budget')
TECHNICAL = {'_source_file', '_loaded_at'}


def csv_from_zip(archive, table, delimiter):
    with zipfile.ZipFile(archive) as z:
        entries = [name for name in z.namelist()
                   if Path(name).name.lower() == f'{table}.csv']
        if len(entries) != 1:
            raise ValueError(f'Expected exactly one {table}.csv in {archive.name}, found {len(entries)}')
        with z.open(entries[0]) as binary:
            text = io.TextIOWrapper(binary, encoding='utf-8-sig', newline='')
            reader = csv.DictReader(text, delimiter=delimiter)
            headers = reader.fieldnames
            if not headers or len(headers) != len(set(headers)):
                raise ValueError(f'Bad/duplicate header in {entries[0]}')
            rows = [dict(row) for row in reader]
            if any(None in row for row in rows):
                raise ValueError(f'Malformed CSV with extra fields: {entries[0]}')
            return headers, rows


def compare(headers, source_rows, bronze_columns, bronze_rows):
    """Compare exact CSV strings as multisets; row order is irrelevant.

    DB SQL NULL and CSV empty field are normalized to '' only for comparison;
    count these cases separately for transparency.
    """
    if set(headers) != set(bronze_columns):
        return {'status': 'REVIEW', 'source_rows': len(source_rows),
                'bronze_rows': len(bronze_rows), 'missing_columns': ','.join(sorted(set(headers)-set(bronze_columns))),
                'extra_columns': ','.join(sorted(set(bronze_columns)-set(headers))),
                'missing_rows': '', 'extra_rows': '', 'null_fields_in_bronze': ''}
    def key(row):
        return tuple('' if row.get(name) is None else str(row[name]) for name in headers)
    src = Counter(key(r) for r in source_rows)
    db = Counter(key(r) for r in bronze_rows)
    missing = sum((src - db).values())
    extra = sum((db - src).values())
    null_count = sum(v is None for r in bronze_rows for v in (r.get(h) for h in headers))
    return {'status': 'PASS' if missing == extra == 0 else 'REVIEW',
            'source_rows': len(source_rows), 'bronze_rows': len(bronze_rows),
            'missing_columns': '', 'extra_columns': '',
            'missing_rows': missing, 'extra_rows': extra,
            'null_fields_in_bronze': null_count}


def connect_pg(args):
    password = os.getenv('PGPASSWORD')
    if password is None:
        password = getpass.getpass('PostgreSQL password (not saved): ')
    try:
        import psycopg
        return psycopg.connect(host=args.host, port=args.port, dbname=args.database,
                               user=args.user, password=password, connect_timeout=10)
    except ImportError:
        try:
            import psycopg2
        except ImportError as exc:
            raise RuntimeError('Install psycopg: py -m pip install "psycopg[binary]"') from exc
        return psycopg2.connect(host=args.host, port=args.port, dbname=args.database,
                                user=args.user, password=password, connect_timeout=10)


def run(args):
    cases = [(t, args.actual, ',') for t in ACTUAL] + [(t, args.budget, ';') for t in BUDGET]
    results = []
    conn = connect_pg(args)
    try:
        with conn.cursor() as cur:
            for table, archive, delim in cases:
                try:
                    headers, src_rows = csv_from_zip(archive, table, delim)
                    cur.execute('SELECT column_name FROM information_schema.columns '
                                'WHERE table_schema = %s AND table_name = %s ORDER BY ordinal_position',
                                ('bronze', table))
                    cols = [r[0] for r in cur.fetchall() if r[0] not in TECHNICAL]
                    if not cols:
                        raise ValueError('Missing bronze table or no business columns')
                    # Identifiers come only from an explicit allowlist (ACTUAL/BUDGET).
                    quoted = ', '.join('"' + col.replace('"', '""') + '"' for col in cols)
                    cur.execute(f'SELECT {quoted} FROM bronze."{table}"')
                    values = cur.fetchall()
                    bronze_rows = [dict(zip(cols, r)) for r in values]
                    result = compare(headers, src_rows, cols, bronze_rows)
                except Exception as ex:
                    conn.rollback()
                    result = {'status': 'ERROR', 'source_rows': '', 'bronze_rows': '',
                              'missing_columns': '', 'extra_columns': '',
                              'missing_rows': '', 'extra_rows': '',
                              'null_fields_in_bronze': '', 'error': f'{type(ex).__name__}: {ex}'}
                result['table_name'] = table
                result['archive'] = archive.name
                results.append(result)
                print(f"{table:20} {result['status']:6} CSV={result['source_rows']} Bronze={result['bronze_rows']} "
                      f"Missing={result['missing_rows']} Extra={result['extra_rows']}")
    finally:
        conn.close()
    fields = ('table_name', 'archive', 'status', 'source_rows', 'bronze_rows',
              'missing_columns', 'extra_columns', 'missing_rows', 'extra_rows',
              'null_fields_in_bronze', 'error')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(results)
    passed = sum(r['status'] == 'PASS' for r in results)
    print(f'\nPASS: {passed}/10; report: {args.output}')
    print('Note: a PostgreSQL NULL and an empty CSV field compare as equivalent. '
          'Check null_fields_in_bronze for this limitation.')
    return 0 if passed == len(results) else 1


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--actual', type=Path, required=True, help='Directo RAW Actual 2023–2025 ZIP')
    p.add_argument('--budget', type=Path, required=True, help='Budget 2023–2025 ZIP')
    p.add_argument('--host', default='localhost')
    p.add_argument('--port', type=int, default=5432)
    p.add_argument('--database', default='postgres')
    p.add_argument('--user', default='postgres')
    p.add_argument('--output', type=Path, default=Path('source_bronze_qa_results.csv'))
    args = p.parse_args()
    try:
        sys.exit(run(args))
    except Exception as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(2)

if __name__ == '__main__':
    main()
