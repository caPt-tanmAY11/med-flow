import os

schema_path = 'prisma/schema.prisma'

with open(schema_path, 'r') as f:
    lines = f.readlines()

# Helper to find line index containing exact string
def find_line_index_startswith(lines, start_str, start_from=0):
    for i in range(start_from, len(lines)):
        if lines[i].strip().startswith(start_str):
            return i
    return -1

# 1. Locate the Duplicate Block
# The duplicate block starts with the SECOND appearance of "model NurseDuty"
first_nurse = find_line_index_startswith(lines, "model NurseDuty")
if first_nurse == -1:
    print("CRITICAL: 'model NurseDuty' not found at all!")
    exit(1)

second_nurse = find_line_index_startswith(lines, "model NurseDuty", first_nurse + 1)
if second_nurse == -1:
    print("Info: Duplicate 'model NurseDuty' not found. Assuming schema is already clean of duplicates.")
    # We still need to check if we need to add ClaimCommunication
else:
    print(f"Found duplicate 'model NurseDuty' at line {second_nurse + 1}. Removing duplicates...")
    
    # The duplicate block ends with "model PatientImplant" 's closing brace, 
    # followed by "enum EncounterType" or similar.
    # Let's find "enum EncounterType" after second_nurse
    encounter_enum = find_line_index_startswith(lines, "enum EncounterType", second_nurse)
    
    if encounter_enum == -1:
        print("Warning: 'enum EncounterType' not found after duplicate start. Looking for end of duplicate PatientImplant...")
        # Fallback: find second 'model PatientImplant'
        first_implant = find_line_index_startswith(lines, "model PatientImplant")
        second_implant = find_line_index_startswith(lines, "model PatientImplant", first_implant + 1)
        if second_implant != -1:
             # Find the closing brace }
             for i in range(second_implant, len(lines)):
                 if lines[i].strip() == "}":
                     # The block to remove ends at i
                     # We want to remove from second_nurse to i (inclusive)
                     # So we keep :second_nurse and i+1:
                     lines = lines[:second_nurse] + lines[i+1:]
                     print(f"Removed duplicate block ending at line {i+1}")
                     break
        else:
            print("Could not find end of duplicates. Aborting deletion to be safe.")
            exit(1)
    else:
        # We assume the duplicate block ends right before 'enum EncounterType'
        # Check if there is a closing brace before it?
        # lines[encounter_enum] is "enum EncounterType {"
        # The duplicates end at encounter_enum - 1 (if it's empty space)
        # We will splice out [second_nurse, encounter_enum)
        lines = lines[:second_nurse] + lines[encounter_enum:]
        print(f"Removed duplicate block up to line {encounter_enum + 1}")

# 2. Add ClaimCommunication
# Check if it already exists
if find_line_index_startswith(lines, "model ClaimCommunication") != -1:
    print("Info: 'model ClaimCommunication' already exists. Skipping insertion.")
else:
    # Insert after model InsuranceClaim
    ins_claim = find_line_index_startswith(lines, "model InsuranceClaim")
    if ins_claim != -1:
        # Find closing brace
        insert_pos = -1
        for i in range(ins_claim, len(lines)):
            if lines[i].strip() == "}":
                insert_pos = i + 1
                break
        
        if insert_pos != -1:
            print(f"Inserting ClaimCommunication after line {insert_pos + 1}")
            new_model = [
                "\n",
                "model ClaimCommunication {\n",
                "  id              String            @id @default(uuid())\n",
                "  claimId         String?\n",
                "  preAuthId       String?\n",
                "  senderId        String\n",
                "  senderName      String\n",
                "  senderRole      String\n",
                "  message         String\n",
                "  sentAt          DateTime          @default(now())\n",
                "  isInternal      Boolean           @default(false)\n",
                "  attachments     String[]\n",
                "  insuranceClaim  InsuranceClaim?   @relation(fields: [claimId], references: [id])\n",
                "  preAuth         PreAuthorization? @relation(fields: [preAuthId], references: [id])\n",
                "\n",
                "  @@index([claimId])\n",
                "  @@index([preAuthId])\n",
                "}\n"
            ]
            lines[insert_pos:insert_pos] = new_model

# 3. Write back
with open(schema_path, 'w') as f:
    f.writelines(lines)
print("Done.")
