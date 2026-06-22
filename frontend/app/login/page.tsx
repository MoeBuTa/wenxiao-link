"use client";

import {
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { QA_ENABLED } from "../lib/features";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(username.trim(), password);
      // Q&A is the only public destination after sign-in; with it off, the
      // sole remaining user is the owner heading for the home page.
      router.push(QA_ENABLED ? "/qa" : "/");
    } catch (err) {
      toast({
        status: "error",
        title: err instanceof ApiError ? err.message : "Login failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container maxW="sm" py={{ base: 12, md: 20 }} px={{ base: 6, md: 10 }}>
      <Heading size="lg" mb={6}>
        Sign in
      </Heading>
      <form onSubmit={(e) => void submit(e)}>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel fontSize="sm">Username</FormLabel>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} bg="bg.surface" />
          </FormControl>
          <FormControl isRequired>
            <FormLabel fontSize="sm">Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              bg="bg.surface"
            />
          </FormControl>
          <Button
            type="submit"
            colorScheme="orange"
            isLoading={busy}
            isDisabled={!username.trim() || !password}
          >
            Sign in
          </Button>
          {QA_ENABLED ? (
            <Text fontSize="sm" color="fg.muted">
              No account?{" "}
              <Link as={NextLink} href="/register">
                Register
              </Link>
            </Text>
          ) : null}
        </VStack>
      </form>
    </Container>
  );
}
