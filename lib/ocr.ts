import Tesseract from 'tesseract.js';

export interface ExtractedData {
    name: string;
    dob: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | '';
    address: string;
    city: string;
    state: string;
    pincode: string;
    aadhaarLast4: string;
    rawText: string;
    confidence: number;
}

// Indian states for address parsing
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
    'Andaman and Nicobar', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Lakshadweep'
];

// Major Indian cities
const MAJOR_CITIES = [
    'Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata',
    'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore',
    'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad',
    'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Varanasi',
    'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Allahabad', 'Ranchi',
    'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai',
    'Raipur', 'Kota', 'Chandigarh', 'Guwahati', 'Solapur', 'Hubli', 'Mysore',
    'Tiruchirappalli', 'Bareilly', 'Aligarh', 'Tiruppur', 'Moradabad', 'Jalandhar',
    'Bhubaneswar', 'Salem', 'Warangal', 'Guntur', 'Bhiwandi', 'Saharanpur',
    'Gorakhpur', 'Bikaner', 'Amravati', 'Noida', 'Jamshedpur', 'Bhilai', 'Cuttack',
    'Firozabad', 'Kochi', 'Nellore', 'Bhavnagar', 'Dehradun', 'Durgapur', 'Asansol',
    'Rourkela', 'Nanded', 'Kolhapur', 'Ajmer', 'Akola', 'Gulbarga', 'Jamnagar',
    'Ujjain', 'Loni', 'Siliguri', 'Jhansi', 'Ulhasnagar', 'Jammu', 'Sangli',
    'Mangalore', 'Erode', 'Belgaum', 'Ambattur', 'Tirunelveli', 'Malegaon',
    'Gaya', 'Jalgaon', 'Udaipur', 'Maheshtala', 'Davanagere', 'Kozhikode',
    'Kurnool', 'Rajpur', 'Rajahmundry', 'Bokaro', 'South Dumdum', 'Bellary',
    'Patiala', 'Gopalpur', 'Agartala', 'Bhagalpur', 'Muzaffarnagar', 'Bhatpara',
    'Panihati', 'Latur', 'Dhule', 'Rohtak', 'Korba', 'Bhilwara', 'Berhampur',
    'Muzaffarpur', 'Ahmednagar', 'Mathura', 'Kollam', 'Avadi', 'Kadapa',
    'Kamarhati', 'Sambalpur', 'Bilaspur', 'Shahjahanpur', 'Satara', 'Bijapur',
    'Rampur', 'Shimoga', 'Chandrapur', 'Junagadh', 'Thrissur', 'Alwar', 'Bardhaman',
    'Kulti', 'Kakinada', 'Nizamabad', 'Parbhani', 'Tumkur', 'Hisar', 'Ozhukarai',
    'Bihar Sharif', 'Panipat', 'Darbhanga', 'Bally', 'Aizawl', 'Dewas', 'Ichalkaranji',
    'Karnal', 'Bathinda', 'Jalna', 'Eluru', 'Barasat', 'Kirari Suleman Nagar',
    'Purnia', 'Satna', 'Mau', 'Sonipat', 'Farrukhabad', 'Sagar', 'Rourkela',
    'Durg', 'Imphal', 'Ratlam', 'Hapur', 'Arrah', 'Anantapur', 'Karimnagar',
    'Etawah', 'Ambernath', 'North Dumdum', 'Bharatpur', 'Begusarai', 'New Delhi',
    'Gandhidham', 'Baranagar', 'Tiruvottiyur', 'Pondicherry', 'Sikar', 'Thoothukudi',
    'Rewa', 'Mirzapur', 'Raichur', 'Pali', 'Ramagundam', 'Haridwar', 'Vijayanagaram',
    'Katihar', 'Nagarcoil', 'Sri Ganganagar', 'Karawal Nagar', 'Mango', 'Thanjavur',
    'Bulandshahr', 'Uluberia', 'Katni', 'Sambhal', 'Singrauli', 'Nadiad', 'Secunderabad'
];

/**
 * Extract text from an image using Tesseract.js
 */
export async function extractTextFromImage(
    imageSource: File | string,
    onProgress?: (progress: number) => void
): Promise<{ text: string; confidence: number }> {
    const result = await Tesseract.recognize(imageSource, 'eng+hin', {
        logger: (m) => {
            if (m.status === 'recognizing text' && onProgress) {
                onProgress(Math.round(m.progress * 100));
            }
        },
    });

    return {
        text: result.data.text,
        confidence: result.data.confidence,
    };
}

/**
 * Parse Aadhaar card text to extract structured data
 * Optimized for standard Aadhaar format with front (address) and back (photo) sides
 */
export function parseAadhaarCard(rawText: string): Partial<ExtractedData> {
    const lines = rawText.split('\n').map(line => line.trim()).filter(Boolean);
    const text = rawText.toUpperCase();
    const fullText = rawText;

    const result: Partial<ExtractedData> = {
        rawText,
        name: '',
        dob: '',
        gender: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        aadhaarLast4: '',
    };

    // ============ EXTRACT AADHAAR NUMBER ============
    // Pattern: 4 digits, space/nothing, 4 digits, space/nothing, 4 digits
    const aadhaarPattern = /\b(\d{4})\s*(\d{4})\s*(\d{4})\b/;
    const aadhaarMatch = rawText.match(aadhaarPattern);
    if (aadhaarMatch) {
        const aadhaarNum = aadhaarMatch[1] + aadhaarMatch[2] + aadhaarMatch[3];
        result.aadhaarLast4 = aadhaarNum.slice(-4);
    }

    // ============ EXTRACT DATE OF BIRTH / YEAR OF BIRTH ============
    // Pattern 1: "Year of Birth : 1987" or "DOB : 15/05/1987"
    const yobPattern = /Year\s*of\s*Birth\s*[:\s]*(\d{4})/i;
    const dobPattern = /(?:DOB|Date\s*of\s*Birth)\s*[:\s]*(\d{2})[\/\-](\d{2})[\/\-](\d{4})/i;
    const datePattern = /\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/;

    const yobMatch = rawText.match(yobPattern);
    const dobMatch = rawText.match(dobPattern);

    if (dobMatch) {
        // Full DOB: DD/MM/YYYY -> YYYY-MM-DD
        result.dob = `${dobMatch[3]}-${dobMatch[2]}-${dobMatch[1]}`;
    } else if (yobMatch) {
        // Year only: assume Jan 1
        result.dob = `${yobMatch[1]}-01-01`;
    } else {
        // Try to find any date pattern
        const dateMatch = rawText.match(datePattern);
        if (dateMatch) {
            result.dob = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
        }
    }

    // ============ EXTRACT GENDER ============
    // Check for Male/Female in English and Hindi
    if (/\bMale\b/i.test(text) && !/Female/i.test(text)) {
        result.gender = 'MALE';
    } else if (/\bFemale\b/i.test(text)) {
        result.gender = 'FEMALE';
    } else if (/पुरुष/.test(fullText)) {
        result.gender = 'MALE';
    } else if (/महिला|स्त्री/.test(fullText)) {
        result.gender = 'FEMALE';
    }

    // ============ EXTRACT PIN CODE ============
    // Indian PIN codes are 6 digits, often at end of address
    const pincodePattern = /\b([1-9]\d{5})\b/g;
    const pincodeMatches = [...rawText.matchAll(pincodePattern)];
    if (pincodeMatches.length > 0) {
        // Take the first valid PIN code (usually in address)
        result.pincode = pincodeMatches[0][1];
    }

    // ============ EXTRACT STATE ============
    for (const state of INDIAN_STATES) {
        const stateRegex = new RegExp(`\\b${state}\\b`, 'i');
        if (stateRegex.test(rawText)) {
            result.state = state;
            break;
        }
    }

    // ============ EXTRACT CITY ============
    for (const city of MAJOR_CITIES) {
        const cityRegex = new RegExp(`\\b${city}\\b`, 'i');
        if (cityRegex.test(rawText)) {
            result.city = city;
            break;
        }
    }

    // ============ EXTRACT NAME ============
    // Strategy 1: Look for name after "To," pattern (front side)
    // Strategy 2: Look for name before "S/O", "D/O", "W/O" pattern
    // Strategy 3: Look for English name on back side near Year of Birth

    let extractedName = '';

    // Pattern 1: Line starting with name (after To, or before S/O)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip headers and common text
        if (/government|india|aadhaar|unique|authority|भारत|सरकार|enrollment|आधार|विशिष्ट/i.test(line)) continue;
        if (/address|पता|to,|to:/i.test(line)) continue;

        // Check for S/O, D/O, W/O pattern - name is usually line before
        if (/^[SDW]\/O\b/i.test(line) && i > 0) {
            const prevLine = lines[i - 1];
            // Previous line should be the name
            const nameMatch = prevLine.match(/^([A-Za-z][A-Za-z\s]+)$/);
            if (nameMatch) {
                extractedName = nameMatch[1].trim();
                break;
            }
        }

        // Check if line looks like a name (2-4 English words, proper case)
        const namePattern = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$/;
        const match = line.match(namePattern);
        if (match && !extractedName) {
            // Verify it's not a place name or common word
            const potentialName = match[1];
            if (!/Road|Street|Nagar|Mumbai|Delhi|Building|Floor|Room/i.test(potentialName)) {
                extractedName = potentialName;
            }
        }
    }

    // Pattern 2: Look near "Year of Birth" - name often appears before it
    const yobIndex = lines.findIndex(l => /Year\s*of\s*Birth/i.test(l));
    if (yobIndex > 0 && !extractedName) {
        for (let i = yobIndex - 1; i >= Math.max(0, yobIndex - 3); i--) {
            const line = lines[i];
            const nameMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$/);
            if (nameMatch) {
                extractedName = nameMatch[1].trim();
                break;
            }
        }
    }

    result.name = extractedName;

    // ============ EXTRACT ADDRESS ============
    // Address usually starts after "To," and contains building/room/road info
    let addressLines: string[] = [];
    let inAddress = false;

    for (const line of lines) {
        // Start capturing after "To," or specific address markers
        if (/^To,?$/i.test(line) || /दिनांक|विषय/i.test(line)) {
            inAddress = true;
            continue;
        }

        // Skip name line and S/O line at beginning of address
        if (inAddress) {
            // Stop if we hit Aadhaar number or certain markers
            if (/\d{4}\s*\d{4}\s*\d{4}/.test(line)) break;
            if (/^Ref:/i.test(line)) break;
            if (/Your\s*Aadhaar/i.test(line)) break;
            if (/आपला\s*आधार/i.test(line)) break;

            // Skip the name line (first proper name after To,)
            if (addressLines.length === 0 && /^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/.test(line)) {
                continue;
            }
            // Skip S/O, D/O, W/O line
            if (/^[SDW]\/O\s/i.test(line)) {
                continue;
            }

            // This is an address line
            if (line.length > 3) {
                addressLines.push(line);
            }
        }
    }

    if (addressLines.length > 0) {
        // Join and clean up the address
        let fullAddress = addressLines.join(', ');
        // Remove phone numbers from address
        fullAddress = fullAddress.replace(/\b\d{10}\b/g, '').trim();
        // Clean up multiple commas
        fullAddress = fullAddress.replace(/,\s*,/g, ',').replace(/,\s*$/, '');
        result.address = fullAddress;
    }

    return result;
}

/**
 * Main function to extract and parse data from an ID card image
 */
export async function extractDataFromIdCard(
    imageSource: File | string,
    onProgress?: (progress: number) => void
): Promise<ExtractedData> {
    const { text, confidence } = await extractTextFromImage(imageSource, onProgress);
    const parsed = parseAadhaarCard(text);

    return {
        name: parsed.name || '',
        dob: parsed.dob || '',
        gender: parsed.gender || '',
        address: parsed.address || '',
        city: parsed.city || '',
        state: parsed.state || '',
        pincode: parsed.pincode || '',
        aadhaarLast4: parsed.aadhaarLast4 || '',
        rawText: text,
        confidence,
    };
}
