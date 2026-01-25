import os

schema_path = 'prisma/schema.prisma'
# schema_path = 'prisma/schema_test.prisma' # for testing

with open(schema_path, 'r') as f:
    lines = f.readlines()

# Goal: Remove lines 1504 to 1744 (1-based)
# In 0-based index: 1503 to 1743 (inclusive)
# So we keep :1503 and 1744:

# Verify line 1504 (index 1503) starts with 'model NurseDuty'
if 'model NurseDuty' not in lines[1503]:
    print(f"Error: Line 1504 is not 'model NurseDuty'. It is: {lines[1503]}")
    # Search for it
    for i, line in enumerate(lines):
        if 'model NurseDuty' in line:
            print(f"Found NurseDuty at line {i+1}")

    exit(1)

# Verify line 1744 (index 1743) is '}'
if lines[1743].strip() != '}':
    print(f"Error: Line 1744 is not '}}'. It is: {lines[1743]}")
    exit(1)

# Remove the block
print("Removing duplicate block...")
new_lines = lines[:1503] + lines[1744:]

# Insert ClaimCommunication
# Find 'model InsuranceClaim'
insert_idx = -1
for i, line in enumerate(new_lines):
    if 'model InsuranceClaim' in line:
        for j in range(i, len(new_lines)):
            if new_lines[j].strip() == '}':
                insert_idx = j + 1
                break
        break

if insert_idx != -1:
    print(f"Inserting ClaimCommunication after line {insert_idx+1} (in new file)")
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
    print("Warning: Could not find InsuranceClaim model to insert ClaimCommunication")

with open(schema_path, 'w') as f:
    f.writelines(new_lines)

print("Schema updated successfully")
