import os, glob, re

files = glob.glob('src/pages/**/*.tsx', recursive=True)

import_str = "import LoadingState from '@/components/common/LoadingState';\nimport ErrorState from '@/components/common/ErrorState';\nimport EmptyState from '@/components/common/EmptyState';\n"

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    if 'if (isLoading)' in content or 'if (error)' in content:
        if 'import LoadingState' not in content:
            last_import_match = list(re.finditer(r'^import .*(?:;|\n)?', content, re.MULTILINE))
            if last_import_match:
                insert_pos = last_import_match[-1].end()
                content = content[:insert_pos] + '\n' + import_str + content[insert_pos:]
            else:
                content = import_str + '\n' + content
        
        content = re.sub(r'if\s*\(isLoading\)\s*return\s*<div[^>]*>.*?</div>;', 'if (isLoading) return <LoadingState />;', content)
        content = re.sub(r'if\s*\(error\)\s*return\s*<div[^>]*>.*?</div>;', 'if (error) return <ErrorState message={error} />;', content)
        content = re.sub(r'if\s*\(!data\)\s*return\s*<div[^>]*>.*?</div>;', 'if (!data) return <EmptyState />;', content)
        
        if content != original_content:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Updated {file}')
