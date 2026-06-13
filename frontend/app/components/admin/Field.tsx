"use client";

import {
  Box,
  FormLabel,
  Input,
  Switch,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";

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
    <VStack align="stretch" spacing={1}>
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
          rows={def.rows ?? 3}
          bg="bg.surface"
        />
      ) : null}

      {def.type === "markdown" ? (
        <MarkdownField value={value ?? ""} onChange={onChange} rows={def.rows ?? 3} />
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
        <Input
          size="sm"
          value={Array.isArray(value) ? value.join(", ") : ""}
          placeholder={def.placeholder ?? "comma, separated, values"}
          onChange={(e) =>
            onChange(
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          bg="bg.surface"
        />
      ) : null}

      {def.help ? (
        <Text fontSize="xs" color="fg.faint">
          {def.help}
        </Text>
      ) : null}
    </VStack>
  );
}
