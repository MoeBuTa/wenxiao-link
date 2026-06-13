"use client";

import { Box, Button, HStack, SimpleGrid } from "@chakra-ui/react";
import { useState } from "react";

// Up to 4 columns × 3 rows = 12 per page; a page selector appears below
// once there are more items than fit on one page.
export function PaginatedGrid<T>({
  items,
  renderItem,
  pageSize = 12,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(items.length / pageSize);
  const start = page * pageSize;
  const slice = items.slice(start, start + pageSize);

  return (
    <Box>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing={4}>
        {slice.map((item, i) => renderItem(item, start + i))}
      </SimpleGrid>

      {totalPages > 1 ? (
        <HStack justify="center" mt={8} spacing={2}>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i}
              size="sm"
              minW="36px"
              colorScheme="orange"
              variant={i === page ? "solid" : "outline"}
              onClick={() => setPage(i)}
            >
              {i + 1}
            </Button>
          ))}
        </HStack>
      ) : null}
    </Box>
  );
}
