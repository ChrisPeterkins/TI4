#!/bin/bash

echo "Updating extraction scripts to point to server instead of client..."

# Find all JavaScript extraction scripts
for file in scripts/extraction/*.js; do
    if [ -f "$file" ]; then
        echo "Updating: $file"
        # Replace client/src/data with server/src/data
        sed -i '' 's|client/src/data|server/src/data|g' "$file"
    fi
done

echo "✅ All extraction scripts updated to use server/src/data"

# Show the changes
echo ""
echo "Verification - all output paths now point to server:"
grep -h "outputPath.*=" scripts/extraction/*.js | grep -v "//" | head -10