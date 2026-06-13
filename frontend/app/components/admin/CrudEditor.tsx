"use client";

import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";

import { ApiError } from "../../lib/api";
import { adminCreate, adminDelete, adminGet, adminList, adminUpdate } from "../../lib/admin-client";
import { Field, type FieldDef } from "./Field";

type Item = Record<string, any> & { id: number };

function FieldGrid({
  fields,
  draft,
  setDraft,
}: {
  fields: FieldDef[];
  draft: Record<string, any>;
  setDraft: (d: Record<string, any>) => void;
}) {
  // Full-width for long fields; two columns for short scalar fields.
  const wide = (f: FieldDef) => f.type === "markdown" || f.type === "textarea" || f.type === "tags";
  return (
    <VStack align="stretch" spacing={3}>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
        {fields
          .filter((f) => !wide(f))
          .map((f) => (
            <Field
              key={f.key}
              def={f}
              value={draft[f.key]}
              onChange={(v) => setDraft({ ...draft, [f.key]: v })}
            />
          ))}
      </SimpleGrid>
      {fields
        .filter(wide)
        .map((f) => (
          <Field
            key={f.key}
            def={f}
            value={draft[f.key]}
            onChange={(v) => setDraft({ ...draft, [f.key]: v })}
          />
        ))}
    </VStack>
  );
}

function ItemCard({
  resource,
  item,
  fields,
  itemTitle,
  loadDetail,
  onSaved,
  onDeleted,
}: {
  resource: string;
  item: Item;
  fields: FieldDef[];
  itemTitle: (i: Item) => string;
  loadDetail: boolean;
  onSaved: (i: Item) => void;
  onDeleted: (id: number) => void;
}) {
  const [draft, setDraft] = useState<Record<string, any>>(item);
  // Baseline that "dirty" compares against — replaced by the full record
  // when loadDetail fetches it, so fields absent from the list payload
  // (e.g. a blog post's body) load before editing and can't be wiped.
  const [baseline, setBaseline] = useState<Record<string, any>>(item);
  const [loaded, setLoaded] = useState(!loadDetail);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  useEffect(() => {
    if (!loadDetail) return;
    let alive = true;
    void adminGet<Item>(resource, item.id)
      .then((full) => {
        if (!alive) return;
        setDraft(full);
        setBaseline(full);
        setLoaded(true);
      })
      .catch(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [resource, item.id, loadDetail]);

  const save = async () => {
    setBusy(true);
    try {
      const updated = await adminUpdate<Item>(resource, item.id, draft);
      setDraft(updated);
      setBaseline(updated);
      onSaved(updated);
      toast({ status: "success", title: "Saved", duration: 1500 });
    } catch (err) {
      toast({ status: "error", title: err instanceof ApiError ? err.message : "Save failed" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this item?")) return;
    setBusy(true);
    try {
      await adminDelete(resource, item.id);
      onDeleted(item.id);
    } catch (err) {
      toast({ status: "error", title: err instanceof ApiError ? err.message : "Delete failed" });
      setBusy(false);
    }
  };

  return (
    <Box borderWidth="1px" borderColor="border.muted" borderRadius="lg" bg="bg.card" p={4}>
      <Flex justify="space-between" align="center" mb={3} gap={2}>
        <Text fontWeight="600" color="fg.default" noOfLines={1}>
          {itemTitle(draft as Item) || "—"}
        </Text>
        <HStack>
          {dirty ? (
            <Text fontSize="xs" color="accent">
              unsaved
            </Text>
          ) : null}
          <Button size="xs" colorScheme="orange" onClick={() => void save()} isLoading={busy} isDisabled={!dirty || !loaded}>
            Save
          </Button>
          <Button size="xs" variant="ghost" color="red.300" onClick={() => void remove()}>
            Delete
          </Button>
        </HStack>
      </Flex>
      {loaded ? (
        <FieldGrid fields={fields} draft={draft} setDraft={setDraft} />
      ) : (
        <Flex justify="center" py={4}>
          <Spinner size="sm" color="accent" />
        </Flex>
      )}
    </Box>
  );
}

export function CrudEditor({
  resource,
  title,
  description,
  fields,
  makeEmpty,
  itemTitle,
  query = "",
  loadDetail = false,
}: {
  resource: string;
  title: string;
  description?: string;
  fields: FieldDef[];
  makeEmpty: () => Record<string, any>;
  itemTitle: (i: Item) => string;
  query?: string;
  // Fetch each row's full record on open (list payload omits some fields,
  // e.g. blog body). Off by default — most lists return complete records.
  loadDetail?: boolean;
}) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [draft, setDraft] = useState<Record<string, any>>(makeEmpty());
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setItems(await adminList<Item>(resource, query));
    } catch (err) {
      toast({ status: "error", title: err instanceof ApiError ? err.message : "Load failed" });
      setItems([]);
    }
  }, [resource, query, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setCreating(true);
    try {
      const created = await adminCreate<Item>(resource, draft);
      setItems((prev) => [created, ...(prev ?? [])]);
      setDraft(makeEmpty());
      toast({ status: "success", title: "Created", duration: 1500 });
    } catch (err) {
      toast({ status: "error", title: err instanceof ApiError ? err.message : "Create failed" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading size="lg">{title}</Heading>
        {description ? (
          <Text fontSize="sm" color="fg.muted" mt={1}>
            {description}
          </Text>
        ) : null}
      </Box>

      <Box borderWidth="1px" borderColor="accent" borderRadius="lg" bg="bg.card" p={4}>
        <Text fontWeight="600" color="accent" mb={3}>
          + Add new
        </Text>
        <FieldGrid fields={fields} draft={draft} setDraft={setDraft} />
        <Button mt={4} size="sm" colorScheme="orange" onClick={() => void create()} isLoading={creating}>
          Create
        </Button>
      </Box>

      {items === null ? (
        <Flex justify="center" py={8}>
          <Spinner color="accent" />
        </Flex>
      ) : items.length === 0 ? (
        <Text color="fg.muted" fontSize="sm">
          No items yet.
        </Text>
      ) : (
        <VStack align="stretch" spacing={4}>
          {items.map((item) => (
            <ItemCard
              key={item.id}
              resource={resource}
              item={item}
              fields={fields}
              itemTitle={itemTitle}
              loadDetail={loadDetail}
              onSaved={(updated) =>
                setItems((prev) => (prev ?? []).map((i) => (i.id === updated.id ? updated : i)))
              }
              onDeleted={(id) => setItems((prev) => (prev ?? []).filter((i) => i.id !== id))}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
}
