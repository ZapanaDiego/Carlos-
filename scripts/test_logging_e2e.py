#!/usr/bin/env python3
"""
End-to-end test: Python engine logging pipeline.

Exercises the Python logger in isolation to verify:
1. JSON output on stderr conforms to telemetry_log.schema.json
2. simulation_step: null is valid
3. simulation_step: integer is valid
4. All log levels produce valid output
5. stdout remains clean (nothing is written to it)
6. Verbosity filtering works per environment

This script captures stderr output, parses it as JSON, and validates
each entry against the telemetry_log.schema.json schema.
"""

import os
import sys
import json
import io

# Add engine directory to path so we can import observability
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'engine'))

from observability import logger

# Load the telemetry schema for validation
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), '..', 'schemas', 'telemetry_log.schema.json')
with open(SCHEMA_PATH, 'r') as f:
    SCHEMA = json.load(f)

REQUIRED_FIELDS = set(SCHEMA.get('required', []))
VALID_LEVELS = set(SCHEMA['properties']['level']['enum'])
SIM_STEP_TYPES = SCHEMA['properties']['simulation_step']['type']  # ["integer", "null"]


def validate_log_entry(entry: dict, test_label: str) -> list[str]:
    """Validate a single log entry dict against the schema. Returns errors."""
    errors = []

    # Check required fields
    for field in REQUIRED_FIELDS:
        if field not in entry:
            errors.append(f"  [{test_label}] Missing required field: {field}")

    # Check level enum
    if 'level' in entry and entry['level'] not in VALID_LEVELS:
        errors.append(f"  [{test_label}] Invalid level: {entry['level']} (valid: {VALID_LEVELS})")

    # Check simulation_step type
    if 'simulation_step' in entry:
        val = entry['simulation_step']
        if val is not None and not isinstance(val, int):
            errors.append(f"  [{test_label}] simulation_step must be integer|null, got: {type(val).__name__} ({val})")

    # Check no additional properties
    allowed = set(SCHEMA.get('properties', {}).keys())
    extra = set(entry.keys()) - allowed
    if extra:
        errors.append(f"  [{test_label}] Extra fields not allowed by schema: {extra}")

    # Check timestamp is a string
    if 'timestamp' in entry and not isinstance(entry['timestamp'], str):
        errors.append(f"  [{test_label}] timestamp must be string, got: {type(entry['timestamp']).__name__}")

    # Check metadata is a dict
    if 'metadata' in entry and not isinstance(entry['metadata'], dict):
        errors.append(f"  [{test_label}] metadata must be object, got: {type(entry['metadata']).__name__}")

    return errors


def capture_stderr_logs(func):
    """Run func and capture everything written to stderr. Returns list of lines."""
    old_stderr = sys.stderr
    captured = io.StringIO()
    sys.stderr = captured
    try:
        func()
    finally:
        sys.stderr = old_stderr
    return captured.getvalue().strip().split('\n')


def capture_stdout_output(func):
    """Run func and capture everything written to stdout. Returns captured text."""
    old_stdout = sys.stdout
    captured = io.StringIO()
    sys.stdout = captured
    try:
        func()
    finally:
        sys.stdout = old_stdout
    return captured.getvalue()


def main():
    print("=" * 60)
    print("  E2E Test: Python Engine Logging Pipeline")
    print("=" * 60)
    print()

    all_errors = []
    total_tests = 0
    passed_tests = 0

    # -----------------------------------------------------------------------
    # Test 1: Basic log emission with simulation_step: null
    # -----------------------------------------------------------------------
    total_tests += 1
    print("Test 1: Log emission with simulation_step: null")

    def emit_null_step():
        os.environ['CARLOSPP_ENV'] = 'dev'
        logger.init_logger()
        logger.info("Test message with null step", source="test.e2e")

    lines = capture_stderr_logs(emit_null_step)
    for line in lines:
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
            errors = validate_log_entry(entry, "null_step")
            if errors:
                all_errors.extend(errors)
            else:
                if entry.get('message') == "Test message with null step":
                    if entry.get('simulation_step') is not None:
                        all_errors.append("  [null_step] simulation_step should be null, got: " + str(entry['simulation_step']))
                    else:
                        print("  ✓ simulation_step: null is valid")
        except json.JSONDecodeError as e:
            all_errors.append(f"  [null_step] Invalid JSON on stderr: {e} — line: {line[:100]}")

    if not any("null_step" in e for e in all_errors):
        passed_tests += 1
    print()

    # -----------------------------------------------------------------------
    # Test 2: Log emission with simulation_step: integer
    # -----------------------------------------------------------------------
    total_tests += 1
    print("Test 2: Log emission with simulation_step: integer")

    def emit_int_step():
        os.environ['CARLOSPP_ENV'] = 'dev'
        logger.init_logger()
        logger.set_simulation_step(42)
        logger.info("Test message at step 42", source="test.e2e")

    lines = capture_stderr_logs(emit_int_step)
    for line in lines:
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
            errors = validate_log_entry(entry, "int_step")
            if errors:
                all_errors.extend(errors)
            if entry.get('message') == "Test message at step 42":
                if entry.get('simulation_step') != 42:
                    all_errors.append(f"  [int_step] simulation_step should be 42, got: {entry.get('simulation_step')}")
                else:
                    print("  ✓ simulation_step: 42 (integer) is valid")
        except json.JSONDecodeError as e:
            all_errors.append(f"  [int_step] Invalid JSON: {e}")

    # Reset simulation step
    logger.set_simulation_step(None)

    if not any("int_step" in e for e in all_errors):
        passed_tests += 1
    print()

    # -----------------------------------------------------------------------
    # Test 3: All log levels produce valid JSON
    # -----------------------------------------------------------------------
    total_tests += 1
    print("Test 3: All log levels produce valid JSON")

    def emit_all_levels():
        os.environ['CARLOSPP_ENV'] = 'dev'
        logger.init_logger()
        logger.trace("trace msg", source="test.levels")
        logger.debug("debug msg", source="test.levels")
        logger.info("info msg", source="test.levels")
        logger.warn("warn msg", source="test.levels")
        logger.error("error msg", source="test.levels")
        logger.fatal("fatal msg", source="test.levels")

    lines = capture_stderr_logs(emit_all_levels)
    levels_seen = set()
    for line in lines:
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
            errors = validate_log_entry(entry, "all_levels")
            if errors:
                all_errors.extend(errors)
            if entry.get('source') == 'test.levels':
                levels_seen.add(entry.get('level'))
        except json.JSONDecodeError as e:
            all_errors.append(f"  [all_levels] Invalid JSON: {e}")

    expected_levels = {'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'}
    missing = expected_levels - levels_seen
    if missing:
        all_errors.append(f"  [all_levels] Missing levels in output: {missing}")
    else:
        print(f"  ✓ All 6 levels emitted: {levels_seen}")

    if not any("all_levels" in e for e in all_errors):
        passed_tests += 1
    print()

    # -----------------------------------------------------------------------
    # Test 4: stdout is NOT contaminated
    # -----------------------------------------------------------------------
    total_tests += 1
    print("Test 4: stdout is NOT contaminated")

    def emit_with_stdout_capture():
        os.environ['CARLOSPP_ENV'] = 'dev'
        logger.init_logger()
        logger.info("This should NOT appear on stdout", source="test.stdout")
        logger.error("Neither should this", source="test.stdout")

    stdout_output = capture_stdout_output(emit_with_stdout_capture)

    if stdout_output.strip():
        all_errors.append(f"  [stdout] CONTAMINATED! Found on stdout: {stdout_output[:200]}")
    else:
        print("  ✓ stdout is clean (empty)")
        passed_tests += 1
    print()

    # -----------------------------------------------------------------------
    # Test 5: Prod mode filters DEBUG/TRACE
    # -----------------------------------------------------------------------
    total_tests += 1
    print("Test 5: Prod mode filters DEBUG/TRACE")

    def emit_prod_filtered():
        os.environ['CARLOSPP_ENV'] = 'prod'
        logger.init_logger()
        logger.trace("should be filtered in prod", source="test.prod")
        logger.debug("should also be filtered", source="test.prod")
        logger.info("should appear in prod", source="test.prod")

    lines = capture_stderr_logs(emit_prod_filtered)
    prod_levels = set()
    for line in lines:
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
            if entry.get('source') == 'test.prod':
                prod_levels.add(entry.get('level'))
        except json.JSONDecodeError:
            pass

    if 'TRACE' in prod_levels:
        all_errors.append("  [prod_filter] TRACE should be filtered in prod mode but was emitted")
    if 'DEBUG' in prod_levels:
        all_errors.append("  [prod_filter] DEBUG should be filtered in prod mode but was emitted")
    if 'INFO' not in prod_levels:
        all_errors.append("  [prod_filter] INFO should be visible in prod mode but was NOT emitted")
    
    if not any("prod_filter" in e for e in all_errors):
        print("  ✓ TRACE and DEBUG filtered in prod mode, INFO visible")
        passed_tests += 1
    print()

    # -----------------------------------------------------------------------
    # Test 6: Schema field validation (no extra fields)
    # -----------------------------------------------------------------------
    total_tests += 1
    print("Test 6: No extra fields in emitted JSON (additionalProperties: false)")

    def emit_with_metadata():
        os.environ['CARLOSPP_ENV'] = 'dev'
        logger.init_logger()
        logger.info("metadata test", source="test.fields", extra_key="value", count=3)

    lines = capture_stderr_logs(emit_with_metadata)
    for line in lines:
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
            if entry.get('message') == "metadata test":
                errors = validate_log_entry(entry, "fields")
                if errors:
                    all_errors.extend(errors)
                else:
                    # Verify metadata contains the extra keys
                    meta = entry.get('metadata', {})
                    if 'extra_key' in meta and 'count' in meta:
                        print("  ✓ Extra kwargs stored in metadata (not as top-level fields)")
                    else:
                        all_errors.append(f"  [fields] kwargs not found in metadata: {meta}")
        except json.JSONDecodeError as e:
            all_errors.append(f"  [fields] Invalid JSON: {e}")

    if not any("fields" in e for e in all_errors):
        passed_tests += 1
    print()

    # -----------------------------------------------------------------------
    # Summary
    # -----------------------------------------------------------------------
    print("=" * 60)
    print(f"  Results: {passed_tests}/{total_tests} tests passed")
    print("=" * 60)

    if all_errors:
        print("\nErrors found:")
        for err in all_errors:
            print(err)
        sys.exit(1)
    else:
        print("\n✓ All E2E tests passed successfully!")


if __name__ == "__main__":
    main()
