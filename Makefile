# REWIND X Master Makefile

.PHONY: setup demo test e2e train eval reset-demo export-samples parity clean

PYTHON = python
NPM = npm

setup:
	$(PYTHON) -m pip install -r backend/requirements.txt
	cd frontend && $(NPM) install

train:
	$(PYTHON) -m ml.train

eval:
	$(PYTHON) -m ml.eval

export-samples:
	$(PYTHON) scripts/export_samples.py

reset-demo:
	$(PYTHON) scripts/reset_demo.py

test:
	pytest backend/tests
	cd frontend && $(NPM) run test

e2e:
	$(PYTHON) scripts/run_e2e_acceptance.py

demo:
	$(PYTHON) scripts/run_demo.py

parity:
	cd frontend && $(NPM) run parity

clean:
	rm -rf backend/__pycache__ backend/*/__pycache__
	rm -rf data/*.db data/*.wal data/*.shm
