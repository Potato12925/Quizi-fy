import json, re

with open(r'C:\Users\ADM\.gemini\antigravity\brain\4a97bf1f-0316-4318-9b69-f29b834c9197\.system_generated\logs\overview.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

content = None
for line in lines[::-1]:
    if '"ReplacementContent":"\"import React, { useState } from \\'react\\';\\nimport { useNavigate } from \\'react-router-dom\\';\\nimport { useAuth }' in line:
        data = json.loads(line)
        for call in data['tool_calls']:
            if call['name'] == 'replace_file_content':
                content = call['args']['ReplacementContent']
                break
        break

if content:
    # It might be double serialized string, wait:
    if isinstance(content, str):
        content = json.loads(content) # "import ..."
    
    # Read the target file and replace the whole block
    with open('src/pages/auth/Login.tsx', 'r', encoding='utf-8') as f:
        file_content = f.read()
    
    # Actually, the original replace_file_content only replaced the top part.
    # Let me just rewrite Login.tsx top part with useAuth and validations manually!
