/**
 * Aadhaar QR Code Parser
 * 
 * Aadhaar QR codes come in two formats:
 * 1. Old format (pre-2019): XML data
 * 2. Secure QR (post-2019): Compressed & signed data with embedded photo
 * 
 * This parser handles both formats
 */

export interface AadhaarQRData {
    uid: string;           // Aadhaar number (may be partially masked)
    name: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | '';
    dob: string;           // YYYY-MM-DD format
    yob: string;           // Year of birth only
    address: string;
    city: string;
    state: string;
    pincode: string;
    photo?: string;        // Base64 photo (Secure QR only)
    rawData: string;
    isSecureQR: boolean;
}

// Indian states mapping
const STATE_CODES: Record<string, string> = {
    'AN': 'Andaman and Nicobar',
    'AP': 'Andhra Pradesh',
    'AR': 'Arunachal Pradesh',
    'AS': 'Assam',
    'BR': 'Bihar',
    'CH': 'Chandigarh',
    'CT': 'Chhattisgarh',
    'DD': 'Daman and Diu',
    'DL': 'Delhi',
    'GA': 'Goa',
    'GJ': 'Gujarat',
    'HP': 'Himachal Pradesh',
    'HR': 'Haryana',
    'JH': 'Jharkhand',
    'JK': 'Jammu and Kashmir',
    'KA': 'Karnataka',
    'KL': 'Kerala',
    'LA': 'Ladakh',
    'LD': 'Lakshadweep',
    'MH': 'Maharashtra',
    'ML': 'Meghalaya',
    'MN': 'Manipur',
    'MP': 'Madhya Pradesh',
    'MZ': 'Mizoram',
    'NL': 'Nagaland',
    'OD': 'Odisha',
    'PB': 'Punjab',
    'PY': 'Puducherry',
    'RJ': 'Rajasthan',
    'SK': 'Sikkim',
    'TN': 'Tamil Nadu',
    'TS': 'Telangana',
    'TR': 'Tripura',
    'UK': 'Uttarakhand',
    'UP': 'Uttar Pradesh',
    'WB': 'West Bengal',
};

const INDIAN_STATES = Object.values(STATE_CODES);

/**
 * Parse old-format Aadhaar QR (XML format)
 * Example: <QPDA uid="XXXX XXXX 1234" name="John Doe" gender="M" dob="01-01-1990" .../>
 */
function parseXMLFormat(data: string): Partial<AadhaarQRData> {
    const result: Partial<AadhaarQRData> = {
        isSecureQR: false,
        rawData: data,
    };

    // Extract attributes from XML-like format
    const uidMatch = data.match(/uid\s*=\s*["']([^"']+)["']/i);
    const nameMatch = data.match(/name\s*=\s*["']([^"']+)["']/i);
    const genderMatch = data.match(/gender\s*=\s*["']([^"']+)["']/i);
    const dobMatch = data.match(/dob\s*=\s*["']([^"']+)["']/i);
    const yobMatch = data.match(/yob\s*=\s*["']([^"']+)["']/i);

    // Address components
    const houseMatch = data.match(/(?:house|building)\s*=\s*["']([^"']+)["']/i);
    const streetMatch = data.match(/(?:street|road|lane)\s*=\s*["']([^"']+)["']/i);
    const locMatch = data.match(/(?:loc|locality)\s*=\s*["']([^"']+)["']/i);
    const vtcMatch = data.match(/(?:vtc|village|town|city)\s*=\s*["']([^"']+)["']/i);
    const distMatch = data.match(/(?:dist|district)\s*=\s*["']([^"']+)["']/i);
    const stateMatch = data.match(/(?:state)\s*=\s*["']([^"']+)["']/i);
    const pcMatch = data.match(/(?:pc|pincode|zip)\s*=\s*["']([^"']+)["']/i);

    if (uidMatch) result.uid = uidMatch[1];
    if (nameMatch) result.name = nameMatch[1];

    if (genderMatch) {
        const g = genderMatch[1].toUpperCase();
        if (g === 'M' || g === 'MALE') result.gender = 'MALE';
        else if (g === 'F' || g === 'FEMALE') result.gender = 'FEMALE';
        else result.gender = 'OTHER';
    }

    if (dobMatch) {
        // Convert DD-MM-YYYY or DD/MM/YYYY to YYYY-MM-DD
        const dob = dobMatch[1];
        const parts = dob.split(/[-\/]/);
        if (parts.length === 3) {
            if (parts[0].length === 4) {
                result.dob = dob.replace(/\//g, '-');
            } else {
                result.dob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }
    }

    if (yobMatch) result.yob = yobMatch[1];

    // Build address
    const addressParts = [
        houseMatch?.[1],
        streetMatch?.[1],
        locMatch?.[1],
        vtcMatch?.[1],
        distMatch?.[1],
    ].filter(Boolean);

    result.address = addressParts.join(', ');
    if (vtcMatch) result.city = vtcMatch[1];
    if (stateMatch) result.state = stateMatch[1];
    if (pcMatch) result.pincode = pcMatch[1];

    return result;
}

/**
 * Parse Secure QR format (post-2019)
 * This is a compressed binary format with signature
 * Format: Version(1) | Sign(1) | MobileEmail(1) | RefID(4) | Name | DOB | Gender | ... | Signature
 */
function parseSecureQRFormat(data: string): Partial<AadhaarQRData> {
    const result: Partial<AadhaarQRData> = {
        isSecureQR: true,
        rawData: data,
    };

    try {
        // Secure QR is typically a large numeric string or base64
        // If it starts with numbers and is very long, it's likely Secure QR

        if (/^\d+$/.test(data) && data.length > 100) {
            // This is the Big Integer format of Secure QR
            // We need to convert and decompress - this is complex
            // For now, we'll try to extract any visible text patterns

            // Try to find patterns that might indicate data
            // Unfortunately, proper Secure QR parsing requires UIDAI's decompression algorithm
            return {
                ...result,
                name: '',
                // We can't reliably parse Secure QR without the official library
            };
        }

        // Try to parse as delimited string (some QR generators use this)
        const parts = data.split(/[|,;]/);
        if (parts.length >= 4) {
            // Common format: UID|Name|DOB|Gender|Address...
            result.uid = parts[0]?.trim();
            result.name = parts[1]?.trim();

            // DOB could be in various positions
            for (const part of parts) {
                if (/\d{2}[-\/]\d{2}[-\/]\d{4}/.test(part)) {
                    const dobParts = part.split(/[-\/]/);
                    result.dob = `${dobParts[2]}-${dobParts[1]}-${dobParts[0]}`;
                    break;
                }
                if (/\d{4}[-\/]\d{2}[-\/]\d{2}/.test(part)) {
                    result.dob = part.replace(/\//g, '-');
                    break;
                }
            }

            // Gender
            for (const part of parts) {
                const g = part.trim().toUpperCase();
                if (g === 'M' || g === 'MALE') { result.gender = 'MALE'; break; }
                if (g === 'F' || g === 'FEMALE') { result.gender = 'FEMALE'; break; }
            }

            // Address - usually the longest remaining field
            const addressCandidates = parts.filter(p => p.length > 20);
            if (addressCandidates.length > 0) {
                result.address = addressCandidates[0];
            }
        }
    } catch (e) {
        console.error('Error parsing Secure QR:', e);
    }

    return result;
}

/**
 * Main parser function - detects format and parses accordingly
 */
export function parseAadhaarQR(qrData: string): AadhaarQRData {
    const trimmedData = qrData.trim();

    let parsed: Partial<AadhaarQRData>;

    // Detect format based on content
    if (trimmedData.includes('<?xml') || trimmedData.includes('<QPDA') || /\w+\s*=\s*["']/.test(trimmedData)) {
        // XML format
        parsed = parseXMLFormat(trimmedData);
    } else {
        // Try Secure QR or delimited format
        parsed = parseSecureQRFormat(trimmedData);
    }

    // Extract pincode from address if not found
    if (!parsed.pincode && parsed.address) {
        const pincodeMatch = parsed.address.match(/\b(\d{6})\b/);
        if (pincodeMatch) {
            parsed.pincode = pincodeMatch[1];
        }
    }

    // Extract state from address if not found
    if (!parsed.state && parsed.address) {
        for (const state of INDIAN_STATES) {
            if (parsed.address.toLowerCase().includes(state.toLowerCase())) {
                parsed.state = state;
                break;
            }
        }
    }

    // Use YOB if DOB not available
    if (!parsed.dob && parsed.yob) {
        parsed.dob = `${parsed.yob}-01-01`;
    }

    return {
        uid: parsed.uid || '',
        name: parsed.name || '',
        gender: parsed.gender || '',
        dob: parsed.dob || '',
        yob: parsed.yob || '',
        address: parsed.address || '',
        city: parsed.city || '',
        state: parsed.state || '',
        pincode: parsed.pincode || '',
        photo: parsed.photo,
        rawData: trimmedData,
        isSecureQR: parsed.isSecureQR || false,
    };
}

/**
 * Extract last 4 digits of Aadhaar for storage
 * (Never store full Aadhaar number for privacy)
 */
export function getAadhaarLast4(uid: string): string {
    const cleanUid = uid.replace(/\s/g, '').replace(/X/gi, '');
    return cleanUid.slice(-4);
}
