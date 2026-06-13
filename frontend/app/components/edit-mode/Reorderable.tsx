"use client";

import { Box, Flex, Icon, SimpleGrid, VStack, useToast } from "@chakra-ui/react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MdDragIndicator } from "react-icons/md";

import { revalidateContent } from "../../actions";
import { adminUpdate } from "../../lib/admin-client";
import { ApiError } from "../../lib/api";
import type { ResourceKey } from "../admin/resources";
import { useEditMode } from "./edit-mode-context";

function DragHandle({ attributes, listeners }: { attributes: any; listeners: any }) {
  return (
    <Box
      {...attributes}
      {...listeners}
      cursor="grab"
      color="fg.faint"
      _hover={{ color: "accent" }}
      aria-label="Drag to reorder"
      sx={{ touchAction: "none" }}
    >
      <Icon as={MdDragIndicator} boxSize={5} />
    </Box>
  );
}

function SortableItem({
  id,
  layout,
  children,
}: {
  id: number;
  layout: "list" | "grid";
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : undefined,
  } as React.CSSProperties;

  if (layout === "grid") {
    return (
      <Box ref={setNodeRef} style={style} position="relative">
        <Box position="absolute" top={1} left={1} zIndex={2} bg="bg.surface" borderRadius="md" p={0.5}>
          <DragHandle attributes={attributes} listeners={listeners} />
        </Box>
        {children}
      </Box>
    );
  }
  return (
    <Flex ref={setNodeRef} style={style} align="flex-start" gap={2}>
      <Box pt={1}>
        <DragHandle attributes={attributes} listeners={listeners} />
      </Box>
      <Box flex="1" minW={0}>
        {children}
      </Box>
    </Flex>
  );
}

// Renders a list/grid of items. In edit mode each item gets a drag handle and
// reordering persists `order` (one PATCH per item) then refreshes. When edit
// mode is off it renders the plain items in the given container (public view
// unchanged).
export function Reorderable<T extends { id: number }>({
  resource,
  items,
  layout = "list",
  renderItem,
  containerProps,
}: {
  resource: ResourceKey;
  items: T[];
  layout?: "list" | "grid";
  renderItem: (item: T) => React.ReactNode;
  containerProps?: Record<string, any>;
}) {
  const { enabled } = useEditMode();
  const router = useRouter();
  const toast = useToast();
  const [order, setOrder] = useState<T[]>(items);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const sig = items.map((i) => i.id).join(",");
  useEffect(() => {
    setOrder(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const Container: any = layout === "grid" ? SimpleGrid : VStack;
  const defaults =
    layout === "grid"
      ? { columns: { base: 1, sm: 2, lg: 3, xl: 4 }, spacing: 4 }
      : { align: "stretch", spacing: 4 };

  if (!enabled) {
    return (
      <Container {...defaults} {...containerProps}>
        {items.map(renderItem)}
      </Container>
    );
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((i) => i.id === Number(active.id));
    const newIndex = order.findIndex((i) => i.id === Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next); // optimistic
    try {
      await Promise.all(next.map((item, idx) => adminUpdate(resource, item.id, { order: idx })));
      await revalidateContent();
      router.refresh();
    } catch (err) {
      toast({ status: "error", title: err instanceof ApiError ? err.message : "Reorder failed" });
      setOrder(items); // revert
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={order.map((i) => i.id)}
        strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <Container {...defaults} {...containerProps}>
          {order.map((item) => (
            <SortableItem key={item.id} id={item.id} layout={layout}>
              {renderItem(item)}
            </SortableItem>
          ))}
        </Container>
      </SortableContext>
    </DndContext>
  );
}
