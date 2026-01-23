import sys
import json
import gzip
import zlib

# Fallback implementation if pyaadhaar fails
class AadhaarSecureQrFallback:
    def __init__(self, base10_data):
        self.data = int(base10_data)
        self.decompressed_data = self._decompress()
        self.parts = self._split_data()

    def _decompress(self):
        # Convert integer to bytes
        # Calculate number of bytes required
        num_bytes = (self.data.bit_length() + 7) // 8
        byte_data = self.data.to_bytes(num_bytes, byteorder='big')
        
        # Decompress using gzip
        try:
            return gzip.decompress(byte_data)
        except Exception:
            # Try zlib if gzip fails
            return zlib.decompress(byte_data)

    def _split_data(self):
        # Secure QR V2 uses delimiter 255 (0xFF)
        return self.decompressed_data.split(b'\xff')

    def decodeddata(self):
        # Mapping for Secure QR V2
        # Based on common observation of UIDAI Secure QR format
        # Indices can vary slightly, so we'll use a mix of index and pattern matching
        
        def get_val(idx):
            if idx < len(self.parts):
                return self.parts[idx].decode('utf-8', errors='ignore')
            return ""

        data = {}
        
        # Extract all parts to search through them
        all_parts = [get_val(i) for i in range(len(self.parts))]
        
        # --- NAME ---
        # Usually at index 2
        data['name'] = get_val(2)
        
        # --- DOB ---
        # Usually at index 3, but let's search for date pattern if not found or to verify
        # Pattern: DD-MM-YYYY or DD/MM/YYYY or YYYY-MM-DD
        import re
        date_pattern = re.compile(r'\b\d{2}[-\/]\d{2}[-\/]\d{4}\b|\b\d{4}[-\/]\d{2}[-\/]\d{2}\b')
        
        dob_val = get_val(3)
        if not date_pattern.search(dob_val):
            # Search in other parts
            for part in all_parts:
                if date_pattern.search(part):
                    dob_val = part
                    break
        data['dob'] = dob_val

        # --- GENDER ---
        # Usually at index 4 (M/F/MALE/FEMALE)
        gender_val = get_val(4)
        if gender_val not in ['M', 'F', 'MALE', 'FEMALE']:
            for part in all_parts:
                if part in ['M', 'F', 'MALE', 'FEMALE']:
                    gender_val = part
                    break
        data['gender'] = gender_val
        
        # --- ADDRESS ---
        # Construct address from specific indices
        address_parts = []
        # Indices: House(8), Street(13), Landmark(7), Loc(9), VTC(15), PO(11), SubDist(14), Dist(6), State(12), PC(10)
        # We'll stick to indices for address components as they are less likely to be random strings
        for idx in [8, 13, 7, 9, 15, 11, 14, 6, 12, 10]:
            val = get_val(idx)
            if val:
                address_parts.append(val)
        
        data['address'] = ", ".join(address_parts)
        data['dist'] = get_val(6)
        data['state'] = get_val(12)
        data['pincode'] = get_val(10)
        data['vtc'] = get_val(15) # City/Village
        
        # --- AADHAAR / REFERENCE ID ---
        # Index 16 usually contains the Reference ID which ends with last 4 digits of Aadhaar
        # Format: XXXXXXXX1234 (Reference ID)
        ref_id = get_val(16)
        if len(ref_id) >= 4 and ref_id.isdigit():
             data['aadhaar_last_4'] = ref_id[-4:]
        else:
            # Try to find a 4-digit number at the end of any part if index 16 fails
            # Or look for a 12-digit number (rare in secure QR)
            if len(all_parts) > 16:
                 # Check the last few parts
                 for part in all_parts[-3:]:
                     if len(part) >= 4 and part.isdigit():
                         data['aadhaar_last_4'] = part[-4:]
                         break
            
            if 'aadhaar_last_4' not in data:
                 data['aadhaar_last_4'] = ""

        return data

def decode(qr_data):
    try:
        # Try importing pyaadhaar first
        try:
            from pyaadhaar.decode import AadhaarSecureQr
            # Check if we can instantiate it (might fail if pyzbar load fails lazily)
            # But usually import fails.
            
            if not qr_data.isdigit():
                raise ValueError("Data is not a valid Secure QR integer string")
                
            obj = AadhaarSecureQr(int(qr_data))
            decoded_data = obj.decodeddata()
            
        except (ImportError, OSError, Exception) as e:
            # Fallback to local implementation
            # sys.stderr.write(f"Using fallback decoder due to: {e}\n")
            
            if not qr_data.isdigit():
                raise ValueError("Data is not a valid Secure QR integer string")
                
            obj = AadhaarSecureQrFallback(qr_data)
            decoded_data = obj.decodeddata()
        
        print(json.dumps({"success": True, "data": decoded_data}))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    # Read from stdin or args
    if len(sys.argv) > 1:
        data = sys.argv[1]
    else:
        # Read from stdin
        try:
            data = sys.stdin.read().strip()
        except:
            data = ""
    
    if not data:
        print(json.dumps({"success": False, "error": "No data provided"}))
    else:
        decode(data)
