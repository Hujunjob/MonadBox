#\!/bin/bash

declare -A class_files
declare -A class_count

# Extract class names from each file
for file in *.css; do
    grep -o "^\.[a-zA-Z][a-zA-Z0-9_-]*" "$file" | while read class; do
        clean_class=$(echo "$class" | sed 's/^\.//')
        echo "$clean_class:$file"
    done
done | while IFS=: read class file; do
    if [[ -z "${class_files[$class]}" ]]; then
        class_files[$class]="$file"
        class_count[$class]=1
    else
        class_files[$class]="${class_files[$class]},$file"
        ((class_count[$class]++))
    fi
done

# Find duplicates
for class in "${\!class_count[@]}"; do
    if [[ ${class_count[$class]} -gt 1 ]]; then
        echo ".$class appears in ${class_count[$class]} files: ${class_files[$class]}"
    fi
done
