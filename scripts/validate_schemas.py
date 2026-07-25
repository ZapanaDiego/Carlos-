#!/usr/bin/env python3
"""
validate_schemas.py — Validación estructural de contratos de datos de Carlos++.

Valida que los tipos TypeScript y modelos Python sean estructuralmente compatibles
con los schemas JSON canónicos:
  - src/types/log.types.ts          vs schemas/telemetry_log.schema.json
  - src/types/log.types.ts          vs schemas/ipc_protocol.schema.json (si existe)
  - engine/models/snapshot.py       vs schemas/ipc_protocol.schema.json (si existe)

La validación es estática (análisis de texto fuente), no runtime.
"""

import os
import sys
import json
import re


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_schema(path: str):
    """Load and parse a JSON Schema file. Returns (schema_dict, error_msg)."""
    if not os.path.exists(path):
        return None, f"Archivo no encontrado: {path}"
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read().strip()
        if not content:
            return None, f"Archivo vacío (0 bytes): {path}"
        return json.loads(content), None
    except json.JSONDecodeError as e:
        return None, f"JSON inválido en {path}: {e}"


def read_file(path: str):
    """Read file content. Returns (content, error_msg)."""
    if not os.path.exists(path):
        return None, f"Archivo no encontrado: {path}"
    with open(path, "r", encoding="utf-8") as f:
        return f.read(), None


# ---------------------------------------------------------------------------
# TypeScript type-mapping helpers
# ---------------------------------------------------------------------------

# Map JSON Schema types to their TypeScript equivalents
JSON_SCHEMA_TYPE_TO_TS = {
    "string": "string",
    "integer": "number",
    "number": "number",
    "boolean": "boolean",
    "object": {"Record", "object", "{"},  # multiple possible representations
    "array": "Array",
    "null": "null",
}


def json_schema_type_to_ts_pattern(schema_type, field_name: str):
    """
    Given a JSON Schema 'type' value (string or list), return a regex pattern
    that should match the TypeScript type annotation for that field.
    
    Returns (pattern: str, human_description: str, is_regex: bool).
    """
    if isinstance(schema_type, list):
        # Union type, e.g. ["integer", "null"] → "number | null"
        ts_types = []
        for t in schema_type:
            if t == "integer" or t == "number":
                ts_types.append("number")
            elif t == "null":
                ts_types.append("null")
            elif t == "string":
                ts_types.append("string")
            elif t == "boolean":
                ts_types.append("boolean")
            else:
                ts_types.append(t)
        # Build regex that matches the union in any order
        # e.g. for ["integer", "null"] → matches "number | null" or "null | number"
        parts = "|".join(re.escape(t) for t in ts_types)
        human = " | ".join(ts_types)
        # Match field_name: <any ordering of the union types>
        # We need to check that all types appear
        return ts_types, human, False  # return list for multi-check
    
    elif isinstance(schema_type, str):
        if schema_type in ("integer", "number"):
            return "number", "number", True
        elif schema_type == "string":
            return "string", "string", True
        elif schema_type == "boolean":
            return "boolean", "boolean", True
        elif schema_type == "object":
            return r"(?:Record|object|\{)", "Record<...> | object | {...}", True
        elif schema_type == "array":
            return r"(?:Array|.*\[\])", "Array<...> | ...[]", True
        elif schema_type == "null":
            return "null", "null", True
        else:
            return None, schema_type, True
    
    return None, str(schema_type), True


def extract_ts_field_type(content: str, field_name: str):
    """
    Extract the TypeScript type annotation for a field from an interface body.
    Returns the type string or None if not found.
    """
    # Match patterns like:  field_name: type;  or  field_name: type\n
    pattern = rf'\b{re.escape(field_name)}\s*:\s*([^;]+);'
    match = re.search(pattern, content)
    if match:
        return match.group(1).strip()
    return None


# ---------------------------------------------------------------------------
# Validators
# ---------------------------------------------------------------------------

def validate_ts_against_telemetry_schema(ts_path: str, schema: dict) -> list[str]:
    """
    Validate TypeScript log types against telemetry_log.schema.json.
    Returns list of error messages (empty = all pass).
    """
    errors = []
    content, err = read_file(ts_path)
    if err:
        return [f"[FAIL] {err}"]

    # Check ILogEntry interface exists
    if "interface ILogEntry" not in content and "type ILogEntry" not in content:
        errors.append(f"[FAIL] {ts_path} no define 'ILogEntry'.")
        return errors

    # Check required fields exist
    required_fields = schema.get("required", [])
    properties = schema.get("properties", {})

    for field in required_fields:
        ts_type = extract_ts_field_type(content, field)
        if ts_type is None:
            errors.append(f"[FAIL] {ts_path}: campo requerido '{field}' no encontrado en ILogEntry.")
            continue

        # Check type compatibility
        field_schema = properties.get(field, {})
        schema_type = field_schema.get("type")
        if schema_type is None:
            continue  # No type constraint in schema (shouldn't happen but be safe)

        ts_expected, human_desc, is_single = json_schema_type_to_ts_pattern(schema_type, field)

        # Special handling: if schema has an enum constraint on a "string" type,
        # the TS field may use a type alias (e.g. LogLevel) instead of literal "string".
        # We validate the alias separately in the enum check below.
        field_enum = field_schema.get("enum")
        if field_enum and schema_type == "string":
            # Check if ts_type is a known type alias that resolves to the enum values
            alias_pattern = rf'type\s+{re.escape(ts_type)}\s*=\s*([^;]+);'
            alias_match = re.search(alias_pattern, content)
            if alias_match:
                # The type alias exists — we'll validate its values in the enum section below
                continue
            # If no alias found, fall through to normal type check

        if is_single:
            # Single type — regex match
            if ts_expected and not re.search(ts_expected, ts_type):
                errors.append(
                    f"[FAIL] {ts_path}: campo '{field}' tiene tipo TS '{ts_type}' "
                    f"pero schema requiere '{human_desc}'."
                )
        else:
            # Union type — check all parts present
            for expected_part in ts_expected:
                if expected_part not in ts_type:
                    errors.append(
                        f"[FAIL] {ts_path}: campo '{field}' tiene tipo TS '{ts_type}' "
                        f"pero le falta '{expected_part}' (schema requiere '{human_desc}')."
                    )

    # Check LogLevel enum matches schema enum
    level_schema = properties.get("level", {})
    schema_enum = level_schema.get("enum")
    if schema_enum:
        # Extract LogLevel type from TS
        level_type_match = re.search(
            r'type\s+LogLevel\s*=\s*([^;]+);', content
        )
        if level_type_match:
            level_type_str = level_type_match.group(1)
            for enum_val in schema_enum:
                if f'"{enum_val}"' not in level_type_str:
                    errors.append(
                        f"[FAIL] {ts_path}: LogLevel no incluye valor '{enum_val}' "
                        f"requerido por schema enum."
                    )
        else:
            # Check if level field type references LogLevel
            level_field_type = extract_ts_field_type(content, "level")
            if level_field_type and "LogLevel" not in level_field_type:
                errors.append(
                    f"[WARN] {ts_path}: campo 'level' tiene tipo '{level_field_type}' "
                    f"— verificar que coincida con enum del schema."
                )

    # Check additionalProperties: false is respected (no extra fields in ILogEntry)
    if schema.get("additionalProperties") is False:
        # Extract all field names from ILogEntry
        all_ts_fields = re.findall(r'\b(\w+)\s*:', content)
        # Filter to just fields inside ILogEntry (rough heuristic)
        interface_match = re.search(
            r'interface\s+ILogEntry\s*\{([^}]+)\}', content, re.DOTALL
        )
        if interface_match:
            interface_body = interface_match.group(1)
            ts_fields_in_interface = set(re.findall(r'\b(\w+)\s*:', interface_body))
            schema_fields = set(properties.keys())
            extra_fields = ts_fields_in_interface - schema_fields
            if extra_fields:
                errors.append(
                    f"[WARN] {ts_path}: ILogEntry tiene campos extra no en schema "
                    f"(additionalProperties: false): {extra_fields}"
                )

    return errors


def validate_python_models_against_ipc(py_path: str, schema: dict) -> list[str]:
    """
    Validate Python model files against ipc_protocol.schema.json.
    Returns list of error messages.
    """
    errors = []
    content, err = read_file(py_path)
    if err:
        return [f"[FAIL] {err}"]

    if not content.strip():
        errors.append(f"[WARN] {py_path} está vacío — no hay modelo que validar.")
        return errors

    # Check required fields from schema exist as class attributes or dict keys
    required_fields = schema.get("required", [])
    properties = schema.get("properties", {})

    for field in required_fields:
        # Check for field as class attribute, dict key, or dataclass field
        patterns = [
            rf'\b{re.escape(field)}\b\s*[=:]',     # attribute assignment
            rf'["\']{ re.escape(field)}["\']\s*:',  # dict key
            rf'\b{re.escape(field)}\b\s*:',         # type annotation
        ]
        found = any(re.search(p, content) for p in patterns)
        if not found:
            errors.append(
                f"[FAIL] {py_path}: campo requerido '{field}' no encontrado."
            )

    return errors


def validate_ts_against_ipc(ts_path: str, schema: dict) -> list[str]:
    """
    Validate TypeScript types against ipc_protocol.schema.json.
    Returns list of error messages.
    """
    errors = []
    content, err = read_file(ts_path)
    if err:
        return [f"[FAIL] {err}"]

    # Look for snapshot-related interfaces/types
    required_fields = schema.get("required", [])
    properties = schema.get("properties", {})

    if not required_fields and not properties:
        errors.append(f"[SKIP] Schema IPC no tiene propiedades definidas — nada que validar.")
        return errors

    for field in required_fields:
        if not re.search(rf'\b{re.escape(field)}\b\s*:', content):
            errors.append(
                f"[FAIL] {ts_path}: campo requerido '{field}' del schema IPC no encontrado."
            )

    return errors


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("  Carlos++ Schema Validation")
    print("=" * 60)
    print()

    all_passed = True
    total_errors = 0
    total_warnings = 0
    total_skipped = 0

    # -----------------------------------------------------------------------
    # 1. TypeScript vs telemetry_log.schema.json
    # -----------------------------------------------------------------------
    print("─" * 60)
    print("1. TypeScript (log.types.ts) vs telemetry_log.schema.json")
    print("─" * 60)

    telemetry_schema, err = load_schema("schemas/telemetry_log.schema.json")
    if err:
        print(f"  [FAIL] {err}")
        all_passed = False
        total_errors += 1
    else:
        ts_log_path = "src/types/log.types.ts"
        errors = validate_ts_against_telemetry_schema(ts_log_path, telemetry_schema)
        if errors:
            for e in errors:
                print(f"  {e}")
                if e.startswith("[FAIL]"):
                    all_passed = False
                    total_errors += 1
                elif e.startswith("[WARN]"):
                    total_warnings += 1
        else:
            print(f"  [PASS] {ts_log_path} es estructuralmente compatible con telemetry_log.schema.json")

    print()

    # -----------------------------------------------------------------------
    # 2. Python models vs ipc_protocol.schema.json
    # -----------------------------------------------------------------------
    print("─" * 60)
    print("2. Python models (snapshot.py) vs ipc_protocol.schema.json")
    print("─" * 60)

    ipc_schema, err = load_schema("schemas/ipc_protocol.schema.json")
    if err:
        print(f"  [SKIP] {err}")
        print(f"         → No se puede validar Python models sin schema IPC.")
        total_skipped += 1
    else:
        py_model_path = "engine/models/snapshot.py"
        errors = validate_python_models_against_ipc(py_model_path, ipc_schema)
        if errors:
            for e in errors:
                print(f"  {e}")
                if e.startswith("[FAIL]"):
                    all_passed = False
                    total_errors += 1
                elif e.startswith("[WARN]"):
                    total_warnings += 1
                elif e.startswith("[SKIP]"):
                    total_skipped += 1
        else:
            print(f"  [PASS] {py_model_path} validado contra ipc_protocol.schema.json")

    print()

    # -----------------------------------------------------------------------
    # 3. TypeScript vs ipc_protocol.schema.json
    # -----------------------------------------------------------------------
    print("─" * 60)
    print("3. TypeScript vs ipc_protocol.schema.json")
    print("─" * 60)

    if ipc_schema is None:
        print(f"  [SKIP] Schema IPC no disponible (vacío o no encontrado).")
        print(f"         → No se puede validar TypeScript contra schema IPC.")
        total_skipped += 1
    else:
        # Find TypeScript files that might define IPC types
        # Common locations for snapshot/IPC types
        ts_ipc_candidates = [
            "src/types/ipc.types.ts",
            "src/types/snapshot.types.ts",
        ]
        found_any = False
        for ts_path in ts_ipc_candidates:
            if os.path.exists(ts_path):
                found_any = True
                errors = validate_ts_against_ipc(ts_path, ipc_schema)
                if errors:
                    for e in errors:
                        print(f"  {e}")
                        if e.startswith("[FAIL]"):
                            all_passed = False
                            total_errors += 1
                        elif e.startswith("[WARN]"):
                            total_warnings += 1
                        elif e.startswith("[SKIP]"):
                            total_skipped += 1
                else:
                    print(f"  [PASS] {ts_path} validado contra ipc_protocol.schema.json")

        if not found_any:
            print(f"  [SKIP] No se encontraron archivos TypeScript IPC para validar.")
            total_skipped += 1

    print()

    # -----------------------------------------------------------------------
    # Summary
    # -----------------------------------------------------------------------
    print("=" * 60)
    print(f"  Resumen: {total_errors} errores, {total_warnings} advertencias, {total_skipped} omitidos")
    print("=" * 60)

    if total_errors > 0:
        print("\n[RESULT] Fallaron algunas validaciones de schema.")
        sys.exit(1)
    elif total_warnings > 0:
        print("\n[RESULT] Validaciones pasaron con advertencias.")
    else:
        print("\n[RESULT] Todas las validaciones de schema fueron exitosas.")


if __name__ == "__main__":
    main()
