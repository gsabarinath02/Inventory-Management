# Fixing Docker `entrypoint.sh: no such file or directory` Error

## Problem

When running your backend Docker container, you see this error:

```
exec /app/entrypoint.sh: no such file or directory
```

Even though the file exists and has the right permissions, the container fails to start.

---

## Root Cause

- This is almost always caused by **Windows line endings (CRLF)** or a hidden BOM (byte order mark) in `entrypoint.sh`.
- Linux expects **LF** line endings. CRLF or BOM will make the file unreadable as a script in Linux containers.

---

## How to Fix

1. **Delete the problematic script** (e.g., `entrypoint.sh`).
2. **Recreate it using a Linux-friendly editor** (VSCode, Sublime, or Notepad++ with LF line endings).
3. **Or, run this command in your project root:**
   ```sh
   dos2unix backend/entrypoint.sh
   ```
   (You may need to install `dos2unix` if it's not available.)
4. **Double-check the first line is exactly:**  
   `#!/bin/sh`
5. **Rebuild your Docker image with:**
   ```sh
   docker-compose build backend --no-cache
   ```
6. **Restart your containers:**
   ```sh
   docker-compose up -d
   ```
7. **Check logs:**
   ```sh
   docker-compose logs --tail=50
   ```

---

## Why This Happens

- **Windows uses CRLF line endings** (`\r\n`), but Linux expects LF (`\n`).
- Shell scripts with CRLF or BOM will not be recognized as valid executables in Linux containers, even if they look fine in your editor.

---

## Pro Tip

- Always use LF line endings for scripts that will run in Docker/Linux.
- Use `.gitattributes` to enforce LF for shell scripts:
  ```
  *.sh text eol=lf
  ```

---

## Example: Correct `entrypoint.sh`

```sh
#!/bin/sh
set -e

echo "Applying database migrations..."
alembic upgrade head

echo "Creating initial admin user..."
python /app/init_admin.py

exec "$@"
```

---

If you follow these steps, you'll be able to fix this issue instantly in the future! 