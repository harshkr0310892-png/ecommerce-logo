#!/bin/bash

folders=("database" "server" "shared" "src")

for folder in "${folders[@]}"; do
  file_count=$(find "$folder" -type f \( \
    -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" -o \
    -name "*.json" -o -name "*.sql" -o -name "*.md" -o -name "*.txt" -o \
    -name "*.prisma" -o -name "*.yml" -o -name "*.yaml" -o -name "*.env" -o \
    -name "*.css" -o -name "*.scss" -o -name "*.html" \
  \) | wc -l)

  line_count=$(find "$folder" -type f \( \
    -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" -o \
    -name "*.json" -o -name "*.sql" -o -name "*.md" -o -name "*.txt" -o \
    -name "*.prisma" -o -name "*.yml" -o -name "*.yaml" -o -name "*.env" -o \
    -name "*.css" -o -name "*.scss" -o -name "*.html" \
  \) -exec wc -l {} + | awk '{total += $1} END {print total}')

  echo "$folder: $file_count files / $line_count lines"
done