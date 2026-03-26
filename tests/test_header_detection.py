import io
import pandas as pd
from app.services.reconciliation_service import _load_excel, _prepare_dataframe

def test_header_detection():
    # Create a dummy dataframe with title rows
    data = [
        ['Chennai Medicco Surgicals', None, None],
        ['Monthly Reconciliation Report', None, None],
        [None, None, None],
        ['Invoice number', 'Taxable value', 'IGST'],
        ['INV-001', 1000, 180],
        ['INV-002', 2000, 360],
    ]
    df_raw = pd.DataFrame(data)
    
    # Save to a bytes buffer as Excel
    buf = io.BytesIO()
    df_raw.to_excel(buf, index=False, header=False)
    buf.seek(0)
    
    # Test _load_excel
    df_loaded = _load_excel(buf, 'test.xlsx')
    
    print("Loaded columns:", list(df_loaded.columns))
    print("Loaded data sample:\n", df_loaded.head())
    
    assert 'Invoice number' in df_loaded.columns
    assert 'Taxable value' in df_loaded.columns
    assert len(df_loaded) == 2
    assert df_loaded.iloc[0]['Invoice number'] == 'INV-001'

    # Test _prepare_dataframe
    df_prepared = _prepare_dataframe(df_loaded, 'test.xlsx')
    assert 'Invoice number' in df_prepared.columns
    assert df_prepared.iloc[0]['Invoice number'] == 'INV-001'
    print("Prepared data sample:\n", df_prepared.head())

if __name__ == "__main__":
    try:
        test_header_detection()
        print("Test passed!")
    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()
