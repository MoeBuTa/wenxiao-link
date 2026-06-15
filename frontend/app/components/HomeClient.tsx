"use client";

import {
  Avatar,
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  Icon,
  Link,
  SimpleGrid,
  Stack,
  Tag,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import {
  FaEnvelope,
  FaGithub,
  FaGraduationCap,
  FaLinkedin,
} from "react-icons/fa";

import type { NewsItem, SiteProfile } from "../lib/types";
import { skillIcon } from "../lib/skill-icons";
import { renderInlineMd } from "./inline-md";
import { AddNewButton, EditProfileButton, EditableItem } from "./edit-mode/EditableItem";
import { Reorderable } from "./edit-mode/Reorderable";

// Logos for schools and employers, self-hosted under public/logos/. The
// Avatar falls back to the org's initials when there is no logo file for it.
function orgLogo(name: string): string | undefined {
  const s = name.toLowerCase();
  if (s.includes("western australia")) return "/logos/uwa.png";
  if (s.includes("wellington") || s.includes("victoria university")) return "/logos/vuw.png";
  if (s.includes("xiamen")) return "/logos/xmut.png";
  if (s.includes("telstra")) return "/logos/telstra.png";
  if (s.includes("china telecom")) return "/logos/china-telecom.png";
  if (s.includes("gillion")) return "/logos/gillion.png";
  return undefined;
}

function Section({
  id,
  title,
  action,
  children,
}: {
  id: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <VStack as="section" id={id} align="stretch" spacing={4} w="full">
      <Box>
        <Flex align="center" gap={3}>
          <Heading size="md">{title}</Heading>
          {action}
        </Flex>
        <Box w="44px" h="3px" bg="accent" borderRadius="full" mt={2} />
      </Box>
      {children}
    </VStack>
  );
}

function IdentityCard({ profile }: { profile: SiteProfile }) {
  const links = [
    { href: `mailto:${profile.email}`, icon: FaEnvelope, label: "Email", external: false },
    { href: profile.links.scholar, icon: FaGraduationCap, label: "Scholar", external: true },
    { href: profile.links.github, icon: FaGithub, label: "GitHub", external: true },
    { href: profile.links.linkedin, icon: FaLinkedin, label: "LinkedIn", external: true },
  ].filter((b) => b.href);

  return (
    <VStack
      as="aside"
      w={{ base: "full", md: "300px" }}
      flexShrink={0}
      spacing={4}
      align="center"
      textAlign="center"
    >
      <Avatar
        src="/avatar.jpg"
        name={profile.name}
        boxSize={{ base: "128px", md: "150px" }}
        borderWidth="3px"
        borderColor="accent"
      />
      <Box>
        <Heading
          as="h1"
          size="xl"
          lineHeight="1.1"
          color="fg.default"
          sx={{
            "@supports (-webkit-background-clip: text) or (background-clip: text)": {
              bgGradient: "linear(to-r, #fb923c, #38bdf8)",
              bgClip: "text",
              WebkitTextFillColor: "transparent",
            },
          }}
        >
          {profile.name}
        </Heading>
        <Text fontSize="xs" fontWeight="700" letterSpacing="wide" color="accent" mt={2}>
          {profile.title}
        </Text>
      </Box>
      <Text fontSize="sm" color="fg.muted">
        {profile.researchDirection}
      </Text>
      <Wrap spacing={5} justify="center" pt={1}>
        {links.map((b) => (
          <WrapItem key={b.label}>
            <Link
              href={b.href}
              isExternal={b.external}
              aria-label={b.label}
              _hover={{ textDecoration: "none" }}
            >
              <VStack spacing={1} color="fg.muted" _hover={{ color: "accent" }} transition="color 0.15s">
                <Icon as={b.icon} boxSize={5} />
                <Text fontSize="xs" fontWeight="500">
                  {b.label}
                </Text>
              </VStack>
            </Link>
          </WrapItem>
        ))}
      </Wrap>
    </VStack>
  );
}

function NewsSection({ news }: { news: NewsItem[] }) {
  return (
    <Section id="news" title="News" action={<AddNewButton resource="news" label="Add" />}>
      <VStack
        align="stretch"
        spacing={0}
        maxH="340px"
        overflowY="auto"
        borderWidth="1px"
        borderColor="border.muted"
        borderRadius="lg"
        bg="bg.card"
      >
        {news.map((item, i) => (
          <EditableItem key={item.id} resource="news" id={item.id} seed={item}>
            <Flex
              gap={3}
              px={4}
              py={3}
              borderBottomWidth={i === news.length - 1 ? 0 : "1px"}
              borderColor="border.muted"
              align="baseline"
            >
              <Badge bg="bg.subtle" color="ocean" flexShrink={0} sx={{ fontVariantNumeric: "tabular-nums" }}>
                {item.date}
              </Badge>
              <Text fontSize="sm" color="fg.default">
                {renderInlineMd(item.text)}
              </Text>
            </Flex>
          </EditableItem>
        ))}
      </VStack>
    </Section>
  );
}

function EducationExperience({ profile }: { profile: SiteProfile }) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} w="full">
      <Section id="education" title="Education" action={<AddNewButton resource="education" label="Add" />}>
        <Reorderable
          resource="education"
          items={profile.education}
          containerProps={{
            maxH: "320px",
            overflowY: "auto",
            borderWidth: "1px",
            borderColor: "border.muted",
            borderRadius: "lg",
            bg: "bg.card",
            p: 4,
          }}
          renderItem={(e) => (
            <EditableItem resource="education" id={e.id} seed={e}>
              <Flex gap={3} align="flex-start">
                <Avatar
                  src={orgLogo(e.institution)}
                  name={e.institution}
                  boxSize="40px"
                  borderRadius="md"
                  flexShrink={0}
                  bg="bg.subtle"
                  color="fg.muted"
                  sx={{ "& img": { objectFit: "contain" } }}
                />
                <Box minW={0}>
                  <Text fontWeight="600" color="fg.default">
                    {e.degree}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    {e.institution}
                  </Text>
                  <Text fontSize="xs" color="fg.faint">
                    {e.period}
                    {e.detail ? ` · ${e.detail}` : ""}
                  </Text>
                </Box>
              </Flex>
            </EditableItem>
          )}
        />
      </Section>
      <Section id="experience" title="Experience" action={<AddNewButton resource="experience" label="Add" />}>
        <Reorderable
          resource="experience"
          items={profile.experience}
          containerProps={{
            maxH: "320px",
            overflowY: "auto",
            borderWidth: "1px",
            borderColor: "border.muted",
            borderRadius: "lg",
            bg: "bg.card",
            p: 4,
          }}
          renderItem={(e) => (
            <EditableItem resource="experience" id={e.id} seed={e}>
              <Flex gap={3} align="flex-start">
                <Avatar
                  src={orgLogo(e.org)}
                  name={e.org}
                  boxSize="40px"
                  borderRadius="md"
                  flexShrink={0}
                  bg="bg.subtle"
                  color="fg.muted"
                  sx={{ "& img": { objectFit: "contain" } }}
                />
                <Box minW={0}>
                  <Text fontWeight="600" color="fg.default">
                    {e.role}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    {e.org}
                  </Text>
                  <Text fontSize="xs" color="fg.faint">
                    {e.period}
                  </Text>
                  {e.detail ? (
                    <Text fontSize="sm" color="fg.muted" mt={1}>
                      {e.detail}
                    </Text>
                  ) : null}
                </Box>
              </Flex>
            </EditableItem>
          )}
        />
      </Section>
    </SimpleGrid>
  );
}

function Skills({ profile }: { profile: SiteProfile }) {
  return (
    <Section id="skills" title="Skills" action={<AddNewButton resource="skills" label="Add" />}>
      <Reorderable
        resource="skills"
        items={profile.skills}
        containerProps={{ spacing: 3 }}
        renderItem={(group) => (
          <EditableItem resource="skills" id={group.id} seed={group}>
            <Box>
              <Text fontSize="xs" fontWeight="700" color="ocean" mb={2} textTransform="uppercase">
                {group.group}
              </Text>
              <Wrap spacing={{ base: 4, md: 5 }}>
                {group.items.map((item) => (
                  <WrapItem key={item}>
                    <VStack spacing={1.5} w="84px" role="group">
                      <Icon
                        as={skillIcon(item)}
                        boxSize={7}
                        color="fg.muted"
                        transition="color 0.15s ease"
                        _groupHover={{ color: "accent" }}
                      />
                      <Text fontSize="xs" color="fg.muted" textAlign="center" lineHeight="1.2">
                        {item}
                      </Text>
                    </VStack>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>
          </EditableItem>
        )}
      />
    </Section>
  );
}

function AboutSection({ profile }: { profile: SiteProfile }) {
  return (
    <Section id="about" title="About" action={<EditProfileButton />}>
      <VStack align="stretch" spacing={3}>
        {profile.summary.map((paragraph, i) => (
          <Text key={i} color="fg.default" lineHeight="1.7">
            {paragraph}
          </Text>
        ))}
      </VStack>
      <Wrap spacing={2}>
        {profile.interests.map((interest) => (
          <WrapItem key={interest}>
            <Tag
              size="sm"
              bg="rgba(56,189,248,0.1)"
              color="ocean"
              borderWidth="1px"
              borderColor="rgba(56,189,248,0.25)"
            >
              {interest}
            </Tag>
          </WrapItem>
        ))}
      </Wrap>
    </Section>
  );
}

export function HomeClient({ profile, news }: { profile: SiteProfile; news: NewsItem[] }) {
  return (
    <Container maxW="5xl" py={{ base: 8, md: 12 }} px={{ base: 6, md: 10 }}>
      {/* Avatar and News sit side by side on top (aligned); About spans the
          full width underneath both. */}
      <Flex direction={{ base: "column", md: "row" }} gap={{ base: 10, md: 12 }} align="flex-start">
        <IdentityCard profile={profile} />

        <VStack flex="1" minW={0} align="stretch">
          <NewsSection news={news} />
        </VStack>
      </Flex>

      <Stack mt={{ base: 12, md: 16 }} spacing={{ base: 12, md: 16 }}>
        <AboutSection profile={profile} />
        <EducationExperience profile={profile} />
        <Skills profile={profile} />
      </Stack>
    </Container>
  );
}
