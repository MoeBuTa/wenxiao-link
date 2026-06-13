"use client";

import {
  Box,
  Button,
  Flex,
  FormLabel,
  HStack,
  Heading,
  Input,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { ApiError } from "../../lib/api";
import { profileGet, profilePatch } from "../../lib/admin-client";
import { TagsInput } from "./Field";

type ProfileData = {
  name: string;
  title: string;
  affiliation: string;
  email: string;
  researchDirection: string;
  summaryText: string;
  interests: string[];
  links: { github: string; linkedin: string; scholar: string; cv: string };
};

function Labeled({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <VStack align="stretch" spacing={1}>
      <FormLabel fontSize="xs" color="fg.muted" mb={0} textTransform="uppercase">
        {label}
      </FormLabel>
      {children}
      {help ? (
        <Text fontSize="xs" color="fg.faint">
          {help}
        </Text>
      ) : null}
    </VStack>
  );
}

export function ProfileEditor({
  onSaved,
  onCancel,
  embedded,
}: {
  onSaved?: () => void;
  onCancel?: () => void;
  embedded?: boolean;
} = {}) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    profileGet<ProfileData>()
      .then(setData)
      .catch((err) =>
        toast({ status: "error", title: err instanceof ApiError ? err.message : "Load failed" }),
      );
  }, [toast]);

  if (!data) {
    return (
      <Flex justify="center" py={10}>
        <Spinner color="accent" />
      </Flex>
    );
  }

  const set = (patch: Partial<ProfileData>) => setData({ ...data, ...patch });
  const setLink = (k: keyof ProfileData["links"], v: string) =>
    setData({ ...data, links: { ...data.links, [k]: v } });

  const save = async () => {
    setBusy(true);
    try {
      const updated = await profilePatch<ProfileData>({
        name: data.name,
        title: data.title,
        affiliation: data.affiliation,
        email: data.email,
        researchDirection: data.researchDirection,
        summaryText: data.summaryText,
        interests: data.interests,
        links: data.links,
      });
      setData(updated);
      toast({ status: "success", title: "Profile saved", duration: 1500 });
      onSaved?.();
    } catch (err) {
      toast({ status: "error", title: err instanceof ApiError ? err.message : "Save failed" });
    } finally {
      setBusy(false);
    }
  };

  const inputBg = { bg: "bg.surface" };

  const form = (
    <VStack align="stretch" spacing={4}>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Labeled label="Name">
          <Input {...inputBg} value={data.name} onChange={(e) => set({ name: e.target.value })} />
        </Labeled>
        <Labeled label="Title">
          <Input {...inputBg} value={data.title} onChange={(e) => set({ title: e.target.value })} />
        </Labeled>
        <Labeled label="Affiliation">
          <Input {...inputBg} value={data.affiliation} onChange={(e) => set({ affiliation: e.target.value })} />
        </Labeled>
        <Labeled label="Email">
          <Input {...inputBg} value={data.email} onChange={(e) => set({ email: e.target.value })} />
        </Labeled>
      </SimpleGrid>

      <Labeled label="Research direction (hero tagline)">
        <Textarea {...inputBg} rows={3} value={data.researchDirection} onChange={(e) => set({ researchDirection: e.target.value })} />
      </Labeled>

      <Labeled label="About summary" help="Separate paragraphs with a blank line.">
        <Textarea {...inputBg} rows={14} value={data.summaryText} onChange={(e) => set({ summaryText: e.target.value })} />
      </Labeled>

      <Labeled label="Research interests" help="Comma-separated.">
        <TagsInput value={data.interests} onChange={(v) => set({ interests: v })} rows={5} />
      </Labeled>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Labeled label="GitHub URL">
          <Input {...inputBg} value={data.links.github} onChange={(e) => setLink("github", e.target.value)} />
        </Labeled>
        <Labeled label="LinkedIn URL">
          <Input {...inputBg} value={data.links.linkedin} onChange={(e) => setLink("linkedin", e.target.value)} />
        </Labeled>
        <Labeled label="Google Scholar URL">
          <Input {...inputBg} value={data.links.scholar} onChange={(e) => setLink("scholar", e.target.value)} />
        </Labeled>
        <Labeled label="CV path/URL" help="e.g. /cv.pdf">
          <Input {...inputBg} value={data.links.cv} onChange={(e) => setLink("cv", e.target.value)} />
        </Labeled>
      </SimpleGrid>

      <HStack>
        <Button colorScheme="orange" onClick={() => void save()} isLoading={busy}>
          Save profile
        </Button>
        {onCancel ? (
          <Button variant="outline" onClick={onCancel} isDisabled={busy}>
            Cancel
          </Button>
        ) : null}
      </HStack>
    </VStack>
  );

  if (embedded) return form;

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading size="lg">Profile &amp; About</Heading>
        <Text fontSize="sm" color="fg.muted" mt={1}>
          Identity, the research-direction tagline, the About summary, interests, and links.
        </Text>
      </Box>

      <Box borderWidth="1px" borderColor="border.muted" borderRadius="lg" bg="bg.card" p={5}>
        {form}
      </Box>
    </VStack>
  );
}
