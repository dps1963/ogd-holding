from pathlib import Path
import shutil, subprocess
root=Path(__file__).resolve().parent.parent
subprocess.run(['python3',str(root/'hosting/render-pages.py'),'--check'],check=True)
out=root/'public'
if out.exists():raise SystemExit('public already exists; use a clean checkout for an immutable build')
out.mkdir()
allowed={'.html','.css','.js','.json','.xml','.txt','.png','.jpg','.jpeg','.webp','.svg','.ico','.woff','.woff2','.ttf','.mp4','.webmanifest'}
for source in root.rglob('*'):
 relative=source.relative_to(root)
 if any(part.startswith('.') or part in {'public','hosting','node_modules'} for part in relative.parts):continue
 if source.is_file() and source.suffix.lower() in allowed:
  target=out/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
