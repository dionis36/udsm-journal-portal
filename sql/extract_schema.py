import os

input_file = r"c:\Users\DIO\Downloads\tjpsd\tjpsd\sql\tjpsd32.sql"
output_file = r"c:\Users\DIO\Downloads\tjpsd\tjpsd\sql\tjpsd32_schema.sql"

KEYWORDS = ("CREATE TABLE", "ALTER TABLE", "DROP TABLE")

def extract_schema():
    print(f"Reading from {input_file}...")
    
    with open(input_file, 'r', encoding='utf-8', errors='replace') as infile, \
         open(output_file, 'w', encoding='utf-8') as outfile:
        
        comment_buffer = []
        in_schema_stmt = False
        
        for line in infile:
            stripped = line.strip()
            
            # Detect comments
            if stripped.startswith("--") or stripped.startswith("/*") or stripped == "":
                if not in_schema_stmt:
                    comment_buffer.append(line)
                else:
                    outfile.write(line)
                continue
            
            # Check for start of interesting statement
            # We look at the start of the line. 
            # Note: Sometimes there might be comments inline or whitespace.
            # But in this dump, it seems standard.
            
            upper_line = stripped.upper()
            is_start = False
            for kw in KEYWORDS:
                if upper_line.startswith(kw):
                    is_start = True
                    break
            
            if is_start:
                # Flush comments that preceded this statement
                if comment_buffer:
                    outfile.writelines(comment_buffer)
                    comment_buffer = []
                
                in_schema_stmt = True
                outfile.write(line)
                
                # Check if it's a one-liner
                if stripped.endswith(';'):
                    in_schema_stmt = False
            
            elif in_schema_stmt:
                outfile.write(line)
                if stripped.endswith(';'):
                    in_schema_stmt = False
            
            else:
                # It's a line we don't care about (e.g. INSERT, SET, or comments for them)
                # clear comment buffer because these comments belong to the ignored section
                # Exception: maybe purely empty lines between blocks? 
                # Ideally we want to keep structure comments but discard data comments.
                # "Dumping data for table..." is a comment we can discard.
                # "Table structure for table..." is a comment we want.
                # Since we buffer comments and only flush them if we hit a SCHEMA keyword,
                # the comments for INSERTs will just be overwritten/cleared when we hit the next non-match
                # or appended and then cleared when we hit a non-match.
                
                # Wait, if we keep appending to comment_buffer, it grows.
                # If we hit an INSERT statement, we should CLEAR the buffer.
                if stripped and not is_start:
                     comment_buffer = []

    print(f"Finished extracting schema to {output_file}")

if __name__ == "__main__":
    extract_schema()
