from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import BinaryIO

import pandas as pd

logger = logging.getLogger(__name__)

REQUIRED_INVOICE_COLUMN = 'Invoice number'
NORMALIZED_INVOICE_COLUMN = 'invoice number'

TAX_COLUMNS = {
    'taxable value': 'Taxable value',
    'igst': 'IGST',
    'cgst': 'CGST',
    'sgst': 'SGST',
}


@dataclass
class ReconciliationResult:
    matched: pd.DataFrame
    books_not_in_2b: pd.DataFrame
    twob_not_in_books: pd.DataFrame
    tax_mismatch: pd.DataFrame
    duplicate_invoices: pd.DataFrame

    @property
    def insights(self) -> dict[str, int]:
        return {
            'matched_count': int(len(self.matched)),
            'books_missing_count': int(len(self.books_not_in_2b)),
            'twob_missing_count': int(len(self.twob_not_in_books)),
            'duplicate_count': int(len(self.duplicate_invoices)),
            'tax_mismatch_count': int(len(self.tax_mismatch)),
        }


def _normalize_header(header: object) -> str:
    return ' '.join(str(header).replace('\n', ' ').strip().lower().split())


def _load_excel(file_obj: BinaryIO, filename: str) -> pd.DataFrame:
    try:
        df = pd.read_excel(file_obj)
    except ValueError as exc:
        raise ValueError(f'Corrupted or unreadable file: {filename}') from exc
    except Exception as exc:
        raise ValueError(f'Failed to read Excel file: {filename}') from exc

    if df.empty:
        raise ValueError(f'Empty Excel file: {filename}')
    if df.shape[0] == 0:
        raise ValueError(f'No data rows found in file: {filename}')

    return df


def _prepare_dataframe(df: pd.DataFrame, source_name: str) -> pd.DataFrame:
    normalized_map = {_normalize_header(col): col for col in df.columns}
    if NORMALIZED_INVOICE_COLUMN not in normalized_map:
        raise ValueError("Required column 'Invoice number' not found in uploaded file")

    invoice_actual_col = normalized_map[NORMALIZED_INVOICE_COLUMN]
    working = df.copy()
    working.rename(columns={invoice_actual_col: REQUIRED_INVOICE_COLUMN}, inplace=True)

    normalized_cols = {_normalize_header(col): col for col in working.columns}
    for normalized_name, standard_name in TAX_COLUMNS.items():
        actual_col = normalized_cols.get(normalized_name)
        if actual_col and actual_col != standard_name:
            working.rename(columns={actual_col: standard_name}, inplace=True)

    working[REQUIRED_INVOICE_COLUMN] = (
        working[REQUIRED_INVOICE_COLUMN]
        .astype(str)
        .str.replace('\n', ' ', regex=False)
        .str.strip()
        .str.upper()
    )
    working = working[working[REQUIRED_INVOICE_COLUMN].notna()]
    working = working[working[REQUIRED_INVOICE_COLUMN] != '']
    working = working[working[REQUIRED_INVOICE_COLUMN] != 'NAN']

    if working.empty:
        raise ValueError(f'No data rows found in file after cleaning: {source_name}')

    return working.reset_index(drop=True)


def _build_duplicate_sheet(books_df: pd.DataFrame, twob_df: pd.DataFrame) -> pd.DataFrame:
    books_duplicates = books_df[books_df.duplicated(subset=[REQUIRED_INVOICE_COLUMN], keep=False)].copy()
    books_duplicates['Source'] = 'Books'

    twob_duplicates = twob_df[twob_df.duplicated(subset=[REQUIRED_INVOICE_COLUMN], keep=False)].copy()
    twob_duplicates['Source'] = '2B'

    if books_duplicates.empty and twob_duplicates.empty:
        return pd.DataFrame(columns=[REQUIRED_INVOICE_COLUMN, 'Source'])

    return pd.concat([books_duplicates, twob_duplicates], ignore_index=True)


def _nan_equal_series(left: pd.Series, right: pd.Series) -> pd.Series:
    return left.eq(right) | (left.isna() & right.isna())


def _build_tax_mismatch_sheet(books_df: pd.DataFrame, twob_df: pd.DataFrame) -> pd.DataFrame:
    available_tax_cols = [col for col in TAX_COLUMNS.values() if col in books_df.columns and col in twob_df.columns]
    if not available_tax_cols:
        return pd.DataFrame(columns=[REQUIRED_INVOICE_COLUMN])

    books_tax = books_df[[REQUIRED_INVOICE_COLUMN, *available_tax_cols]].copy()
    twob_tax = twob_df[[REQUIRED_INVOICE_COLUMN, *available_tax_cols]].copy()

    merged_tax = books_tax.merge(
        twob_tax,
        on=REQUIRED_INVOICE_COLUMN,
        how='inner',
        suffixes=('_books', '_2b'),
        copy=False,
    )

    if merged_tax.empty:
        return merged_tax

    mismatch_flags = []
    for col in available_tax_cols:
        left_col = f'{col}_books'
        right_col = f'{col}_2b'

        left_numeric = pd.to_numeric(merged_tax[left_col], errors='coerce')
        right_numeric = pd.to_numeric(merged_tax[right_col], errors='coerce')

        mismatch_flags.append(~_nan_equal_series(left_numeric, right_numeric))

    any_mismatch = mismatch_flags[0]
    for flag in mismatch_flags[1:]:
        any_mismatch = any_mismatch | flag

    return merged_tax[any_mismatch].reset_index(drop=True)


def reconcile_files(books_file: BinaryIO, books_filename: str, twob_file: BinaryIO, twob_filename: str) -> ReconciliationResult:
    logger.info('Starting reconciliation for files books=%s twob=%s', books_filename, twob_filename)

    books_raw = _load_excel(books_file, books_filename)
    twob_raw = _load_excel(twob_file, twob_filename)

    books_clean = _prepare_dataframe(books_raw, books_filename)
    twob_clean = _prepare_dataframe(twob_raw, twob_filename)

    books_clean = books_clean.dropna(subset=[REQUIRED_INVOICE_COLUMN])
    twob_clean = twob_clean.dropna(subset=[REQUIRED_INVOICE_COLUMN])

    matched = books_clean.merge(
        twob_clean,
        on=REQUIRED_INVOICE_COLUMN,
        how='inner',
        suffixes=('_books', '_2b'),
        copy=False,
    )

    twob_invoice_keys = twob_clean[[REQUIRED_INVOICE_COLUMN]].drop_duplicates()
    books_not_in_2b = books_clean.merge(
        twob_invoice_keys,
        on=REQUIRED_INVOICE_COLUMN,
        how='left',
        indicator=True,
        copy=False,
    )
    books_not_in_2b = books_not_in_2b[books_not_in_2b['_merge'] == 'left_only'].drop(columns=['_merge'])

    books_invoice_keys = books_clean[[REQUIRED_INVOICE_COLUMN]].drop_duplicates()
    twob_not_in_books = twob_clean.merge(
        books_invoice_keys,
        on=REQUIRED_INVOICE_COLUMN,
        how='left',
        indicator=True,
        copy=False,
    )
    twob_not_in_books = twob_not_in_books[twob_not_in_books['_merge'] == 'left_only'].drop(columns=['_merge'])

    duplicates = _build_duplicate_sheet(books_clean, twob_clean)
    tax_mismatch = _build_tax_mismatch_sheet(books_clean, twob_clean)

    logger.info(
        'Reconciliation complete matched=%d books_missing=%d twob_missing=%d duplicates=%d tax_mismatch=%d',
        len(matched),
        len(books_not_in_2b),
        len(twob_not_in_books),
        len(duplicates),
        len(tax_mismatch),
    )

    return ReconciliationResult(
        matched=matched,
        books_not_in_2b=books_not_in_2b.reset_index(drop=True),
        twob_not_in_books=twob_not_in_books.reset_index(drop=True),
        tax_mismatch=tax_mismatch,
        duplicate_invoices=duplicates.reset_index(drop=True),
    )
