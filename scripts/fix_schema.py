import os

schema_path = 'prisma/schema.prisma'

with open(schema_path, 'r') as f:
    lines = f.readlines()

def find_nth_occurrence(lines, content, n):
    count = 0
    for i, line in enumerate(lines):
        if content in line:
            count += 1
            if count == n:
                return i
    return -1

# Find 2nd 'model NurseDuty'
start_delete = find_nth_occurrence(lines, 'model NurseDuty {', 2)
if start_delete == -1:
    print("Could not find 2nd occurrence of 'model NurseDuty'")
    # Try finding first occurrence just in case it's not duplicated but something else is wrong?
    # Or maybe it's 'model NurseDuty {' with spaces?
    # Let's try looser match
    start_delete = find_nth_occurrence(lines, 'model NurseDuty', 2)

if start_delete == -1:
    print("Error: Could not find 2nd 'model NurseDuty'. Maybe already fixed?")
    exit(1)

print(f"Start delete (duplicate NurseDuty) at line {start_delete + 1}")

# Find 2nd 'model PatientImplant'
implant_start = find_nth_occurrence(lines, 'model PatientImplant', 2)
if implant_start == -1:
    print("Error: Could not find 2nd 'model PatientImplant'")
    exit(1)

print(f"Duplicate PatientImplant starts at line {implant_start + 1}")

# Find closing brace for PatientImplant
end_delete = -1
for i in range(implant_start, len(lines)):
    if lines[i].strip() == '}':
        end_delete = i
        break

if end_delete == -1:
    print("Error: Could not find closing brace for duplicate PatientImplant")
    exit(1)

print(f"End delete at line {end_delete + 1}")

# Check content after end_delete
# It should be close to 'enum EncounterType' or 'enum Gender' etc if those were preserved in original
# In 1st copy, PatientImplant is typically followed by Enums if they are at end.
# In duplicated copy, it might be followed by 'enum EncounterType' if that was also duplicated? 
# Or if duplication stopped there.

# We will cut from start_delete to end_delete (inclusive)
# So new lines = lines[:start_delete] + lines[end_delete+1:]

new_lines = lines[:start_delete] + lines[end_delete+1:]

# Insert ClaimCommunication
insert_idx = -1
for i, line in enumerate(new_lines):
    if 'model InsuranceClaim' in line:
        for j in range(i, len(new_lines)):
            if new_lines[j].strip() == '}':
                insert_idx = j + 1
                break
        break

if insert_idx != -1:
    print(f"Inserting ClaimCommunication after line {insert_idx}")
    communication_model = [
        '\n',
        'model ClaimCommunication {\n',
        '  id              String            @id @default(uuid())\n',
        '  claimId         String?\n',
        '  preAuthId       String?\n',
        '  senderId        String\n',
        '  senderName      String\n',
        '  senderRole      String\n',
        '  message         String\n',
        '  sentAt          DateTime          @default(now())\n',
        '  isInternal      Boolean           @default(false)\n',
        '  attachments     String[]\n',
        '  insuranceClaim  InsuranceClaim?   @relation(fields: [claimId], references: [id])\n',
        '  preAuth         PreAuthorization? @relation(fields: [preAuthId], references: [id])\n',
        '\n',
        '  @@index([claimId])\n',
        '  @@index([preAuthId])\n',
        '}\n'
    ]
    new_lines[insert_idx:insert_idx] = communication_model
else:
    print("Error: Could not find InsuranceClaim model")

with open(schema_path, 'w') as f:
    f.writelines(new_lines)

print("Schema fixed successfully")
