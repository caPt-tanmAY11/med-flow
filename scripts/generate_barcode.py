"""
Lab Barcode Generator - Generates unique barcodes with checksum for lab samples
Uses Code128 standard with institution prefix, date encoding, and sequence number
"""

import sys
import json
import hashlib
from datetime import datetime
import argparse


def calculate_check_digit(barcode_data: str) -> str:
    """Calculate Luhn check digit for barcode validation"""
    def luhn_checksum(data: str) -> int:
        digits = [int(c) for c in data if c.isdigit()]
        odd_digits = digits[-1::-2]
        even_digits = digits[-2::-2]
        
        total = sum(odd_digits)
        for d in even_digits:
            total += sum(divmod(d * 2, 10))
        
        return (10 - (total % 10)) % 10
    
    # Convert alphanumeric to numeric for checksum
    numeric_str = ''.join(str(ord(c) % 10) for c in barcode_data)
    return str(luhn_checksum(numeric_str))


def generate_barcode(
    lab_code: str,
    patient_id: str,
    test_code: str,
    sequence: int,
    timestamp: datetime = None
) -> dict:
    """
    Generate a unique barcode with checksum
    
    Format: {LAB}-{YYMMDD}{HHMMSS}-{PATIENT_SHORT}-{TEST}-{SEQ}-{CHECK}
    
    Args:
        lab_code: LAB or RAD
        patient_id: Patient UHID (e.g., UHID-123456)
        test_code: Test code (e.g., CBC, LFT)
        sequence: Sequential number for the day
        timestamp: Optional timestamp (defaults to now)
    
    Returns:
        Dictionary with barcode and metadata
    """
    if timestamp is None:
        timestamp = datetime.now()
    
    # Clean patient ID - extract numeric portion
    patient_short = ''.join(c for c in patient_id if c.isdigit())[-6:].zfill(6)
    
    # Date/time components
    date_str = timestamp.strftime('%y%m%d')
    time_str = timestamp.strftime('%H%M%S')
    
    # Sequence padded to 4 digits
    seq_str = str(sequence).zfill(4)
    
    # Build barcode base (without check digit)
    barcode_base = f"{lab_code}{date_str}{time_str}{patient_short}{test_code.upper()[:4]}{seq_str}"
    
    # Calculate check digit
    check_digit = calculate_check_digit(barcode_base)
    
    # Final barcode with separators for readability
    barcode = f"{lab_code}-{date_str}{time_str}-{patient_short}-{test_code.upper()[:4]}-{seq_str}-{check_digit}"
    
    # Generate a unique hash for additional verification
    hash_input = f"{barcode}{timestamp.isoformat()}"
    unique_hash = hashlib.sha256(hash_input.encode()).hexdigest()[:8].upper()
    
    return {
        "barcode": barcode,
        "barcode_compact": barcode.replace("-", ""),
        "components": {
            "lab_code": lab_code,
            "date": date_str,
            "time": time_str,
            "patient_id": patient_short,
            "test_code": test_code.upper()[:4],
            "sequence": seq_str,
            "check_digit": check_digit
        },
        "verification_hash": unique_hash,
        "generated_at": timestamp.isoformat(),
        "is_valid": validate_barcode(barcode)
    }


def validate_barcode(barcode: str) -> bool:
    """Validate a barcode's check digit"""
    try:
        # Remove separators
        parts = barcode.split("-")
        if len(parts) != 6:
            return False
        
        # Reconstruct base (without check digit)
        check_digit = parts[-1]
        barcode_base = "".join(parts[:-1])
        
        # Verify check digit
        calculated = calculate_check_digit(barcode_base)
        return calculated == check_digit
    except Exception:
        return False


def main():
    parser = argparse.ArgumentParser(description='Generate lab sample barcode')
    parser.add_argument('--lab-code', '-l', default='LAB', help='Lab code (LAB or RAD)')
    parser.add_argument('--patient-id', '-p', required=True, help='Patient UHID')
    parser.add_argument('--test-code', '-t', required=True, help='Test code')
    parser.add_argument('--sequence', '-s', type=int, required=True, help='Sequence number')
    parser.add_argument('--validate', '-v', help='Validate an existing barcode')
    
    args = parser.parse_args()
    
    if args.validate:
        is_valid = validate_barcode(args.validate)
        result = {"barcode": args.validate, "is_valid": is_valid}
    else:
        result = generate_barcode(
            lab_code=args.lab_code.upper(),
            patient_id=args.patient_id,
            test_code=args.test_code,
            sequence=args.sequence
        )
    
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
