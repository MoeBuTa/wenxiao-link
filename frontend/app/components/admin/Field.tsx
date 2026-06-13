"use client";

import { FormLabel, Input, Switch, Text, Textarea, VStack } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

import { MarkdownField } from "./MarkdownField";

export type FieldType = "text" | "textarea" | "markdown" | "number" | "bool" | "tags";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
  rows?: number;
};

// Comma-separated tag editor. Keeps a raw text buffer so typing a space or a
// trailing comma is preserved (the old version re-normalized on every
// keystroke, which ate spaces/commas and jumped the cursor to the end).
// Rendered as a full-width multi-line textarea for breathing room.
export function TagsInput({
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  value: unknown;
  onChange: (v: string[]) => void;
  rows?: number;
  placeholder?: string;
}) {
  const ext = Array.isArray(value) ? (value as string[]).join(", ") : "";
  const [raw, setRaw] = useState(ext);
  const lastEmitted = useRef(ext);

  // Resync only when the value changes from outside our own edits (e.g. the
  // drawer re-seeds with a different item) — never mid-typing.
  useEffect(() => {
    if (ext !== lastEmitted.current) {
      setRaw(ext);
      lastEmitted.current = ext;
    }
  }, [ext]);

  const handle = (s: string) => {
    setRaw(s);
    const parsed = s.split(",").map((t) => t.trim()).filter(Boolean);
    lastEmitted.current = parsed.join(", ");
    onChange(parsed);
  };

  return (
    <Textarea
      value={raw}
      onChange={(e) => handle(e.target.value)}
      rows={rows}
      placeholder={placeholder ?? "comma, separated, values"}
      bg="bg.surface"
      w="full"
    />
  );
}

export function Field({
  def,
  value,
  onChange,
}: {
  def: FieldDef;
  value: any;
  onChange: (v: any) => void;
}) {
  return (
    <VStack align="stretch" spacing={1} w="full">
      {def.type === "bool" ? (
        <Switch
          isChecked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          colorScheme="orange"
        >
          <Text as="span" fontSize="sm" ml={2}>
            {def.label}
          </Text>
        </Switch>
      ) : (
        <FormLabel fontSize="xs" color="fg.muted" mb={0} textTransform="uppercase">
          {def.label}
        </FormLabel>
      )}

      {def.type === "text" ? (
        <Input
          size="sm"
          value={value ?? ""}
          placeholder={def.placeholder}
          onChange={(e) => onChange(e.target.value)}
          bg="bg.surface"
        />
      ) : null}

      {def.type === "textarea" ? (
        <Textarea
          value={value ?? ""}
          placeholder={def.placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={def.rows ?? 6}
          bg="bg.surface"
          w="full"
        />
      ) : null}

      {def.type === "markdown" ? (
        <MarkdownField value={value ?? ""} onChange={onChange} rows={def.rows ?? 8} />
      ) : null}

      {def.type === "number" ? (
        <Input
          size="sm"
          type="number"
          value={value ?? ""}
          placeholder={def.placeholder}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          bg="bg.surface"
          maxW="160px"
        />
      ) : null}

      {def.type === "tags" ? (
        <TagsInput value={value} onChange={onChange} rows={def.rows ?? 3} placeholder={def.placeholder} />
      ) : null}

      {def.help ? (
        <Text fontSize="xs" color="fg.faint">
          {def.help}
        </Text>
      ) : null}
    </VStack>
  );
}
