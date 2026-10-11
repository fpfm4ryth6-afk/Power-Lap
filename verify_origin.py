import pathlib, hashlib, json, sys
root = pathlib.Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'SHA256_MANIFEST.json').read_text(encoding='utf-8'))
wrong = []
for rel, wanted in manifest.items():
    p = root / rel
    actual = hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else 'MISSING'
    if actual != wanted:
        wrong.append(rel)
print(f'Original-Dateiprüfung: {len(manifest)-len(wrong)}/{len(manifest)} korrekt')
if wrong:
    print('Abweichungen:', ', '.join(wrong))
    sys.exit(1)
