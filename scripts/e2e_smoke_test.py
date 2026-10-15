import requests, json, time

BASE = 'http://localhost:8000/api/v1'
TOKEN = 'rx_dev_token_secret_key_2026'
H = {'X-Dev-Token': TOKEN}

# Health
r = requests.get(f'{BASE}/health')
print('HEALTH:', r.json())

# Ready
r = requests.get(f'{BASE}/ready')
print('READY:', r.json())

# Create mission
r = requests.post(f'{BASE}/missions', json={'goal': 'Analyze orbital debris patterns and generate avoidance maneuver recommendations', 'constraints': ['no_external_writes']}, headers=H)
m = r.json()
mid = m['id']
print(f'MISSION CREATED: {mid}')

# Get plan
r = requests.get(f'{BASE}/missions/{mid}/plan')
plan = r.json()
nsteps = len(plan['steps'])
print(f'PLAN STEPS: {nsteps}')

# Rehearse
r = requests.post(f'{BASE}/missions/{mid}/rehearse', headers=H)
reh = r.json()
prov = reh.get('provenance')
nirrev = len(reh.get('irreversible_ops', []))
print(f'REHEARSAL: provenance={prov}, irreversible={nirrev}')

# Run
r = requests.post(f'{BASE}/missions/{mid}/run', headers=H)
print(f'RUN: {r.json()}')
time.sleep(3)

# Status
r = requests.get(f'{BASE}/missions/{mid}')
ms = r.json()
done = ms['counts']['done']
total = ms['counts']['steps']
print(f'STATUS: {ms["status"]}, done={done}/{total}')

# Audit chain
r = requests.get(f'{BASE}/audit/verify')
av = r.json()
print(f'AUDIT CHAIN: valid={av["valid"]}, checked={av["checked"]}')

# MCP servers
r = requests.get(f'{BASE}/mcp/servers')
print(f'MCP SERVERS: {len(r.json())}')

# ML models
r = requests.get(f'{BASE}/ml/models')
print(f'ML MODELS: {len(r.json())}')

print('ALL E2E CHECKS PASSED')
