"use client";

import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Heading,
  Link,
  Spinner,
  Text,
  Textarea,
  VStack,
  useToast,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ApiError, apiJson } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import type { QAComment } from "../lib/types";

function formatWhen(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Australia/Perth",
  });
}

function NameBadge({ comment }: { comment: QAComment }) {
  return (
    <HStack spacing={2}>
      <Text fontWeight="600" fontSize="sm" color="fg.default">
        {comment.displayName}
      </Text>
      {comment.isOwner ? (
        <Badge
          bg="rgba(249,115,22,0.16)"
          color="#fdba74"
          borderRadius="full"
          px={2}
          fontSize="0.65em"
        >
          Author
        </Badge>
      ) : !comment.isRegistered ? (
        <Badge colorScheme="gray" variant="outline" fontSize="0.65em">
          Guest
        </Badge>
      ) : null}
    </HStack>
  );
}

type ComposerProps = {
  placeholder: string;
  submitLabel: string;
  onSubmit: (body: string) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
};

function Composer({
  placeholder,
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus,
}: ComposerProps) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      await onSubmit(body.trim());
      setBody("");
    } catch (err) {
      toast({
        status: "error",
        title: err instanceof ApiError ? err.message : "Something went wrong.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <VStack align="stretch" spacing={2}>
      <Textarea
        placeholder={placeholder}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        bg="bg.surface"
        autoFocus={autoFocus}
      />
      <HStack>
        <Button
          size="sm"
          colorScheme="orange"
          onClick={() => void submit()}
          isLoading={busy}
          isDisabled={!body.trim()}
        >
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </HStack>
    </VStack>
  );
}

function CommentBody({
  comment,
  onChanged,
}: {
  comment: QAComment;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const saveEdit = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await apiJson(`/api/qa/${comment.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ body: draft.trim() }),
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      toast({
        status: "error",
        title: err instanceof ApiError ? err.message : "Edit failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await apiJson(`/api/qa/${comment.id}/`, { method: "DELETE" });
      onChanged();
    } catch (err) {
      toast({
        status: "error",
        title: err instanceof ApiError ? err.message : "Delete failed.",
      });
    }
  };

  if (editing) {
    return (
      <VStack align="stretch" spacing={2}>
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} bg="bg.surface" />
        <HStack>
          <Button size="xs" colorScheme="orange" onClick={() => void saveEdit()} isLoading={busy}>
            Save
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              setDraft(comment.body);
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </HStack>
      </VStack>
    );
  }

  return (
    <>
      <Text fontSize="sm" color="fg.default" whiteSpace="pre-wrap">
        {comment.body}
      </Text>
      {comment.canModify ? (
        <HStack spacing={3} mt={1}>
          <Button size="xs" variant="link" color="fg.muted" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button size="xs" variant="link" color="red.300" onClick={() => void remove()}>
            Delete
          </Button>
        </HStack>
      ) : null}
    </>
  );
}

function Thread({
  comment,
  onChanged,
}: {
  comment: QAComment;
  onChanged: () => void;
}) {
  const [replying, setReplying] = useState(false);

  const postReply = async (body: string) => {
    await apiJson("/api/qa/", {
      method: "POST",
      body: JSON.stringify({ body, parent: comment.id }),
    });
    setReplying(false);
    onChanged();
  };

  return (
    <Box borderWidth="1px" borderColor="border.muted" borderRadius="lg" bg="bg.card" p={4}>
      <Flex justify="space-between" align="baseline" mb={1} gap={2} wrap="wrap">
        <NameBadge comment={comment} />
        <Text fontSize="xs" color="fg.faint">
          {formatWhen(comment.createdAt)}
          {comment.isEdited ? " · edited" : ""}
        </Text>
      </Flex>
      <CommentBody comment={comment} onChanged={onChanged} />

      {(comment.replies ?? []).length > 0 ? (
        <VStack
          align="stretch"
          spacing={3}
          mt={3}
          pl={4}
          borderLeftWidth="2px"
          borderColor="border.default"
        >
          {comment.replies!.map((reply) => (
            <Box key={reply.id}>
              <Flex justify="space-between" align="baseline" mb={1} gap={2} wrap="wrap">
                <NameBadge comment={reply} />
                <Text fontSize="xs" color="fg.faint">
                  {formatWhen(reply.createdAt)}
                  {reply.isEdited ? " · edited" : ""}
                </Text>
              </Flex>
              <CommentBody comment={reply} onChanged={onChanged} />
            </Box>
          ))}
        </VStack>
      ) : null}

      <Box mt={3}>
        {replying ? (
          <Composer
            placeholder="Write a reply…"
            submitLabel="Reply"
            onSubmit={postReply}
            onCancel={() => setReplying(false)}
            autoFocus
          />
        ) : (
          <Button size="xs" variant="link" color="accent" onClick={() => setReplying(true)}>
            Reply
          </Button>
        )}
      </Box>
    </Box>
  );
}

export function QABoard() {
  const { user } = useAuth();
  const [comments, setComments] = useState<QAComment[] | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setComments(await apiJson<QAComment[]>("/api/qa/", { cache: "no-store" }));
    } catch (err) {
      toast({
        status: "error",
        title: err instanceof ApiError ? err.message : "Could not load comments.",
      });
      setComments([]);
    }
  }, [toast]);

  useEffect(() => {
    void load();
    // Re-fetch when auth state changes so canModify flags stay accurate.
  }, [load, user?.username]);

  const post = async (body: string) => {
    await apiJson("/api/qa/", {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    await load();
  };

  return (
    <Container maxW="3xl" py={{ base: 8, md: 12 }} px={{ base: 6, md: 10 }}>
      <Heading size="lg" mb={2}>
        Q&A
      </Heading>
      <Text color="fg.muted" fontSize="sm" mb={6}>
        Ask me anything — research, engineering, or otherwise. Post as a guest (no
        name needed), or{" "}
        <Link as={NextLink} href="/login">
          sign in
        </Link>{" "}
        to manage your comments later.
      </Text>

      <Box
        bg="bg.card"
        borderWidth="1px"
        borderColor="border.muted"
        borderRadius="lg"
        p={4}
        mb={8}
      >
        {user ? (
          <Text fontSize="sm" color="fg.muted" mb={2}>
            Posting as <b>{user.username}</b>
            {user.isSuperuser ? " (owner)" : ""}
          </Text>
        ) : null}
        <Composer
          placeholder="Write a question or comment…"
          submitLabel="Post"
          onSubmit={post}
        />
      </Box>

      {comments === null ? (
        <Flex justify="center" py={10}>
          <Spinner color="accent" />
        </Flex>
      ) : comments.length === 0 ? (
        <Text color="fg.muted" fontSize="sm">
          No comments yet — be the first to ask something.
        </Text>
      ) : (
        <VStack align="stretch" spacing={4}>
          {comments.map((comment) => (
            <Thread key={comment.id} comment={comment} onChanged={() => void load()} />
          ))}
        </VStack>
      )}
    </Container>
  );
}
