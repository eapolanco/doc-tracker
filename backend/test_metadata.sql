-- Test queries to verify metadata storage in SQLite database

-- 1. Check schema - verify new columns exist
PRAGMA table_info(documents);

-- 2. View all documents with their metadata
SELECT 
    id,
    name,
    type,
    fileSize,
    tags,
    datetime(uploadedAt, 'unixepoch') as uploaded_date,
    datetime(lastModified, 'unixepoch') as modified_date,
    category,
    cloudSource,
    status,
    encrypted
FROM documents
ORDER BY uploadedAt DESC
LIMIT 20;

-- 3. Check files with sizes
SELECT 
    name,
    type,
    fileSize,
    ROUND(fileSize / 1024.0, 2) as size_kb,
    ROUND(fileSize / 1048576.0, 2) as size_mb,
    category
FROM documents
WHERE type = 'file' AND fileSize IS NOT NULL
ORDER BY fileSize DESC;

-- 4. Check folders (should have NULL fileSize)
SELECT 
    name,
    type,
    fileSize,
    category,
    path
FROM documents
WHERE type = 'folder';

-- 5. View documents with tags
SELECT 
    name,
    tags,
    category
FROM documents
WHERE tags != '[]';

-- 6. Storage summary by category
SELECT 
    category,
    COUNT(*) as file_count,
    SUM(CASE WHEN type = 'file' THEN 1 ELSE 0 END) as files,
    SUM(CASE WHEN type = 'folder' THEN 1 ELSE 0 END) as folders,
    SUM(fileSize) as total_bytes,
    ROUND(SUM(fileSize) / 1048576.0, 2) as total_mb
FROM documents
WHERE deleted = 0
GROUP BY category
ORDER BY total_bytes DESC;

-- 7. Recently uploaded files
SELECT 
    name,
    category,
    ROUND(fileSize / 1024.0, 2) as size_kb,
    datetime(uploadedAt, 'unixepoch') as uploaded,
    cloudSource
FROM documents
WHERE type = 'file'
ORDER BY uploadedAt DESC
LIMIT 10;

-- 8. Files without metadata (for debugging)
SELECT 
    name,
    type,
    fileSize,
    tags,
    uploadedAt
FROM documents
WHERE fileSize IS NULL AND type = 'file';
