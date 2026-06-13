"use client";

import {
  Button,
  Container,
  FormControl,
  FormErrorMessage,
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

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mismatch) return;
    setBusy(true);
    try {
      await register({
        username: username.trim(),
        password,
        email: email.trim() || undefined,
      });
      router.push("/qa");
    } catch (err) {
      toast({
        status: "error",
        title: err instanceof ApiError ? err.message : "Registration failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container maxW="sm" py={{ base: 12, md: 20 }} px={{ base: 6, md: 10 }}>
      <Heading size="lg" mb={6}>
        Create an account
      </Heading>
      <form onSubmit={(e) => void submit(e)}>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel fontSize="sm">Username</FormLabel>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} bg="bg.surface" />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm">Email (optional)</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              bg="bg.surface"
            />
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
          <FormControl isRequired isInvalid={mismatch}>
            <FormLabel fontSize="sm">Confirm password</FormLabel>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              bg="bg.surface"
            />
            <FormErrorMessage>Passwords do not match.</FormErrorMessage>
          </FormControl>
          <Button
            type="submit"
            colorScheme="orange"
            isLoading={busy}
            isDisabled={!username.trim() || password.length < 8 || mismatch}
          >
            Register
          </Button>
          <Text fontSize="sm" color="fg.muted">
            Already have an account?{" "}
            <Link as={NextLink} href="/login">
              Sign in
            </Link>
          </Text>
        </VStack>
      </form>
    </Container>
  );
}
