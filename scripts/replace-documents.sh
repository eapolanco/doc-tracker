#!/bin/bash

# Document Replacement Script
# This script helps you replace placeholder files with real documents

echo "================================================"
echo "  DocTracker - Document Replacement Utility"
echo "================================================"
echo ""

DOCS_DIR="/workspaces/doc-tracker/documents"

# Function to list all placeholder files
list_placeholders() {
    echo "📄 Current placeholder files:"
    echo ""
    find "$DOCS_DIR" -type f -size 0 | while read file; do
        echo "  - ${file#$DOCS_DIR/}"
    done
    echo ""
}

# Function to replace a file
replace_file() {
    local category=$1
    local filename=$2
    local source_path=$3
    
    local target_dir="$DOCS_DIR/$category"
    local target_file="$target_dir/$filename"
    
    if [ ! -f "$source_path" ]; then
        echo "❌ Source file not found: $source_path"
        return 1
    fi
    
    mkdir -p "$target_dir"
    cp "$source_path" "$target_file"
    echo "✅ Replaced: $category/$filename"
}

# Function to add a new document
add_document() {
    local category=$1
    local source_path=$2
    
    if [ ! -f "$source_path" ]; then
        echo "❌ Source file not found: $source_path"
        return 1
    fi
    
    local filename=$(basename "$source_path")
    local target_dir="$DOCS_DIR/$category"
    
    mkdir -p "$target_dir"
    cp "$source_path" "$target_dir/$filename"
    echo "✅ Added: $category/$filename"
}

# Function to scan and update database
rescan_documents() {
    echo "🔄 Rescanning documents..."
    curl -X POST http://localhost:3001/api/scan 2>/dev/null
    echo ""
    echo "✅ Database updated"
}

# Main menu
show_menu() {
    echo "What would you like to do?"
    echo ""
    echo "1) List all placeholder files"
    echo "2) Replace a specific file"
    echo "3) Add a new document"
    echo "4) Bulk replace from directory"
    echo "5) Rescan documents"
    echo "6) Exit"
    echo ""
    read -p "Choose an option (1-6): " choice
    
    case $choice in
        1)
            list_placeholders
            ;;
        2)
            read -p "Category (e.g., Legal, Finance): " category
            read -p "Filename (e.g., Passport_Copy.jpg): " filename
            read -p "Source file path: " source
            replace_file "$category" "$filename" "$source"
            ;;
        3)
            read -p "Category: " category
            read -p "Source file path: " source
            add_document "$category" "$source"
            ;;
        4)
            read -p "Source directory path: " source_dir
            read -p "Target category: " category
            if [ -d "$source_dir" ]; then
                find "$source_dir" -type f | while read file; do
                    add_document "$category" "$file"
                done
            else
                echo "❌ Directory not found"
            fi
            ;;
        5)
            rescan_documents
            ;;
        6)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo "Invalid option"
            ;;
    esac
    
    echo ""
    show_menu
}

# Check if running in interactive mode
if [ -t 0 ]; then
    show_menu
else
    # Non-interactive mode - show usage
    echo "Usage: $0"
    echo ""
    echo "Or use directly:"
    echo "  $0 add <category> <file_path>"
    echo "  $0 replace <category> <filename> <source_path>"
    echo "  $0 list"
    echo "  $0 rescan"
fi
