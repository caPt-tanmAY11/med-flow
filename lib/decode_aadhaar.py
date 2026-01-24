import sys
import json
import gzip
import zlib
import re

class AadhaarSecureQrDecoder:
    """
    Decoder for UIDAI Secure QR Code (V2)
    
    Secure QR contains:
    - Reference ID (with last 4 digits of Aadhaar)
    - Name, DOB, Gender
    - Full Address components
    - Digital signature (ignored in extraction-only mode)
    """
    
    def __init__(self, base10_data):
        self.raw_data = str(base10_data)
        self.data = int(base10_data)
        self.decompressed_data = self._decompress()
        self.parts = self._split_data()
        self.all_parts_text = [self._decode_part(i) for i in range(len(self.parts))]

    def _decompress(self):
        # Convert integer to bytes
        num_bytes = (self.data.bit_length() + 7) // 8
        byte_data = self.data.to_bytes(num_bytes, byteorder='big')
        
        # Try gzip first, then zlib
        try:
            return gzip.decompress(byte_data)
        except Exception:
            try:
                return zlib.decompress(byte_data)
            except Exception:
                # Return as-is if decompression fails
                return byte_data

    def _split_data(self):
        # Secure QR V2 uses delimiter 255 (0xFF)
        return self.decompressed_data.split(b'\xff')

    def _decode_part(self, idx):
        if idx < len(self.parts):
            try:
                return self.parts[idx].decode('utf-8', errors='ignore').strip()
            except:
                return ""
        return ""

    def get_all_parts(self):
        """Return all parts for debugging"""
        return {f"part_{i}": self._decode_part(i) for i in range(len(self.parts))}

    def decodeddata(self):
        """
        Extract identity data from Secure QR
        
        Common index mapping (may vary):
        0: Email/Mobile hash flags
        1: Reference ID (last digits = Aadhaar last 4)
        2: Name
        3: DOB (DD-MM-YYYY or DDMMYYYY or YYYY-MM-DD)
        4: Gender (M/F)
        5: Care Of (S/O, D/O, W/O)
        6: District
        7: Landmark
        8: House
        9: Location
        10: Pincode
        11: Post Office
        12: State
        13: Street
        14: Sub District
        15: VTC (Village/Town/City)
        16+: Photo/Signature data
        """
        
        data = {}
        parts = self.all_parts_text
        
        # --- DEBUG: Include all parts ---
        data['_raw_parts'] = parts[:20]  # First 20 parts for debugging
        
        # --- REFERENCE ID / AADHAAR LAST 4 ---
        # Usually at index 1 or 16, format: "XXXXXXXX1234" where 1234 is last 4
        ref_id = ""
        aadhaar_last_4 = ""
        
        # Try index 1 first (common in newer format)
        if len(parts) > 1 and parts[1].isdigit() and len(parts[1]) >= 4:
            ref_id = parts[1]
            aadhaar_last_4 = ref_id[-4:]
        # Try index 16 (older format)
        elif len(parts) > 16 and parts[16].isdigit() and len(parts[16]) >= 4:
            ref_id = parts[16]
            aadhaar_last_4 = ref_id[-4:]
        else:
            # Search for any 8+ digit number (reference ID pattern)
            for i, part in enumerate(parts):
                if part.isdigit() and len(part) >= 8:
                    ref_id = part
                    aadhaar_last_4 = part[-4:]
                    break
        
        data['reference_id'] = ref_id
        data['aadhaar_last_4'] = aadhaar_last_4
        data['aadhaar_masked'] = f"XXXX XXXX {aadhaar_last_4}" if aadhaar_last_4 else ""
        
        # --- NAME ---
        # Usually at index 2
        name = parts[2] if len(parts) > 2 else ""
        # Validate it looks like a name (letters and spaces)
        if not re.match(r'^[A-Za-z\s]+$', name):
            # Search for a name-like field
            for part in parts[2:10]:
                if re.match(r'^[A-Za-z][A-Za-z\s]{2,}$', part):
                    name = part
                    break
        data['name'] = name
        
        # --- DOB ---
        # Usually at index 3, formats: DD-MM-YYYY, DD/MM/YYYY, DDMMYYYY, YYYY-MM-DD
        dob = ""
        dob_raw = parts[3] if len(parts) > 3 else ""
        
        # Pattern 1: DD-MM-YYYY or DD/MM/YYYY
        date_match = re.search(r'(\d{2})[-/](\d{2})[-/](\d{4})', dob_raw)
        if date_match:
            dob = f"{date_match.group(1)}-{date_match.group(2)}-{date_match.group(3)}"
        # Pattern 2: DDMMYYYY (8 digits)
        elif re.match(r'^\d{8}$', dob_raw):
            dob = f"{dob_raw[:2]}-{dob_raw[2:4]}-{dob_raw[4:]}"
        # Pattern 3: YYYY-MM-DD
        elif re.match(r'^\d{4}-\d{2}-\d{2}$', dob_raw):
            dob = dob_raw
        else:
            # Search in all parts for a date pattern
            for part in parts:
                date_match = re.search(r'(\d{2})[-/](\d{2})[-/](\d{4})', part)
                if date_match:
                    dob = f"{date_match.group(1)}-{date_match.group(2)}-{date_match.group(3)}"
                    break
                if re.match(r'^\d{8}$', part):
                    dob = f"{part[:2]}-{part[2:4]}-{part[4:]}"
                    break
        
        data['dob'] = dob
        data['dob_raw'] = dob_raw  # For debugging
        
        # --- GENDER ---
        gender = parts[4] if len(parts) > 4 else ""
        if gender not in ['M', 'F', 'MALE', 'FEMALE', 'T', 'TRANSGENDER']:
            # Search for gender pattern
            for part in parts:
                if part.upper() in ['M', 'F', 'MALE', 'FEMALE', 'T', 'TRANSGENDER']:
                    gender = part
                    break
        data['gender'] = gender.upper() if gender else ""
        
        # --- ADDRESS COMPONENTS ---
        data['care_of'] = parts[5] if len(parts) > 5 else ""
        data['district'] = parts[6] if len(parts) > 6 else ""
        data['landmark'] = parts[7] if len(parts) > 7 else ""
        data['house'] = parts[8] if len(parts) > 8 else ""
        data['location'] = parts[9] if len(parts) > 9 else ""
        data['pincode'] = parts[10] if len(parts) > 10 else ""
        data['post_office'] = parts[11] if len(parts) > 11 else ""
        data['state'] = parts[12] if len(parts) > 12 else ""
        data['street'] = parts[13] if len(parts) > 13 else ""
        data['sub_district'] = parts[14] if len(parts) > 14 else ""
        data['vtc'] = parts[15] if len(parts) > 15 else ""  # Village/Town/City
        
        # --- FULL ADDRESS ---
        address_components = [
            data['house'],
            data['street'],
            data['landmark'],
            data['location'],
            data['vtc'],
            data['post_office'],
            data['sub_district'],
            data['district'],
            data['state'],
            data['pincode']
        ]
        data['address'] = ", ".join([c for c in address_components if c and c.strip()])
        
        return data


def decode(qr_data):
    try:
        if not qr_data.strip():
            raise ValueError("Empty data provided")
            
        if not qr_data.strip().isdigit():
            raise ValueError("Data is not a valid Secure QR integer string. Got non-digit characters.")
        
        decoder = AadhaarSecureQrDecoder(qr_data.strip())
        decoded_data = decoder.decodeddata()
        
        print(json.dumps({"success": True, "data": decoded_data}))
        
    except Exception as e:
        import traceback
        print(json.dumps({
            "success": False, 
            "error": str(e),
            "traceback": traceback.format_exc()
        }))


if __name__ == "__main__":
    # Read from stdin or args
    if len(sys.argv) > 1:
        data = sys.argv[1]
    else:
        try:
            data = sys.stdin.read().strip()
        except:
            data = ""
    
    if not data:
        print(json.dumps({"success": False, "error": "No data provided"}))
    else:
        decode(data)
