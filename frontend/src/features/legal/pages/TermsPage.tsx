import { Box, Heading, Text, VStack, Link, UnorderedList, ListItem, Divider } from '@chakra-ui/react'
import { Layout } from '../../../shared/components/Layout'
import { PageContainer } from '../../../shared/components/PageContainer'

const EFFECTIVE_DATE = 'May 16, 2026'
const CONTACT_EMAIL = 'inquiry@bigfynite.com'

export function TermsPage() {
  return (
    <Layout>
      <PageContainer>
        <VStack align="stretch" spacing={6} maxW="3xl" mx="auto" py={4}>
          <Box>
            <Heading size="lg" color="brand.900">
              Terms of Service
            </Heading>
            <Text color="gray.600" fontSize="sm" mt={1}>
              Effective date: {EFFECTIVE_DATE}
            </Text>
          </Box>

          <Text>
            Welcome to Meet Sync. These Terms of Service (&quot;Terms&quot;) govern your use of the
            Meet Sync application and related services (the &quot;Service&quot;). By signing in or
            otherwise using the Service, you agree to these Terms. If you do not agree, do not use
            the Service.
          </Text>

          <Divider />

          <Section title="1. Eligibility &amp; account">
            <UnorderedList spacing={1} pl={6}>
              <ListItem>
                You must be at least 13 years old (or the minimum age in your jurisdiction) to use
                Meet Sync.
              </ListItem>
              <ListItem>
                You sign in with a Google account. You are responsible for the security of that
                account and for activity that happens under it.
              </ListItem>
              <ListItem>
                You agree to provide accurate information and to keep it up to date.
              </ListItem>
            </UnorderedList>
          </Section>

          <Section title="2. License to use the service">
            <Text>
              Subject to these Terms, we grant you a limited, non-exclusive, non-transferable,
              revocable license to use the Service for its intended purpose: managing event booths,
              capturing visitor data, and sharing booth documents.
            </Text>
          </Section>

          <Section title="3. Your content">
            <UnorderedList spacing={1} pl={6}>
              <ListItem>
                You retain ownership of files you upload and data you enter (&quot;Your
                Content&quot;).
              </ListItem>
              <ListItem>
                Files are stored in your own Google Drive. Sheets are created in your own Google
                account. We do not claim rights to Your Content.
              </ListItem>
              <ListItem>
                You grant Meet Sync the limited rights needed to operate the Service: to read,
                process (including via OCR and Anthropic&apos;s Claude API), display, and share
                Your Content as you direct through the app (for example, sharing a Drive file with
                a visitor who scans your booth QR).
              </ListItem>
              <ListItem>
                You are solely responsible for Your Content and for ensuring you have the right to
                upload it.
              </ListItem>
            </UnorderedList>
          </Section>

          <Section title="4. Acceptable use">
            <Text>You agree not to:</Text>
            <UnorderedList spacing={1} pl={6}>
              <ListItem>Use the Service to violate any law or third party&apos;s rights.</ListItem>
              <ListItem>
                Upload content that is unlawful, infringing, defamatory, or contains malware.
              </ListItem>
              <ListItem>
                Attempt to access accounts, data, or systems that don&apos;t belong to you, or
                bypass authentication, rate limits, or security controls.
              </ListItem>
              <ListItem>
                Reverse engineer, scrape, or build a competing product from the Service.
              </ListItem>
              <ListItem>
                Use the Service to send unsolicited communications or harvest contact data without
                consent.
              </ListItem>
            </UnorderedList>
            <Text mt={3}>
              We may suspend or terminate accounts that violate these rules.
            </Text>
          </Section>

          <Section title="5. Third-party services">
            <Text>
              The Service relies on third-party providers, including Google (sign-in, Drive,
              Sheets) and Anthropic (Claude API). Your use of those services is governed by their
              own terms. We are not responsible for outages or changes in third-party services.
            </Text>
          </Section>

          <Section title="6. Visitor check-in">
            <UnorderedList spacing={1} pl={6}>
              <ListItem>
                When a visitor scans a booth QR code and submits the check-in form, their name,
                email, and optional phone number are written to the exhibitor&apos;s Google Sheet,
                and shared documents may be granted to their Google account.
              </ListItem>
              <ListItem>
                Exhibitors are the controllers of the visitor data they collect and are responsible
                for handling it in accordance with applicable law (including obtaining any required
                consent).
              </ListItem>
            </UnorderedList>
          </Section>

          <Section title="7. Intellectual property">
            <Text>
              The Service, including its branding, code, design, and documentation, is owned by
              Meet Sync and its licensors. Except for the license granted in Section 2, these Terms
              do not transfer any rights in the Service to you.
            </Text>
          </Section>

          <Section title="8. Disclaimers">
            <Text>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;, WITHOUT
              WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not
              warrant that the Service will be uninterrupted, error-free, or that OCR results will
              be accurate.
            </Text>
          </Section>

          <Section title="9. Limitation of liability">
            <Text>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, MEET SYNC AND ITS AFFILIATES WILL NOT BE
              LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR
              LOST PROFITS OR LOST DATA. Our total liability for any claim arising out of or
              relating to the Service will not exceed the greater of (a) the amount you paid us for
              the Service in the twelve months preceding the claim, or (b) USD $50.
            </Text>
          </Section>

          <Section title="10. Indemnity">
            <Text>
              You agree to indemnify and hold Meet Sync harmless from claims, damages, and expenses
              (including reasonable legal fees) arising out of your use of the Service, Your
              Content, or your violation of these Terms.
            </Text>
          </Section>

          <Section title="11. Termination">
            <UnorderedList spacing={1} pl={6}>
              <ListItem>
                You may stop using the Service at any time and revoke Meet Sync&apos;s Google
                access from your Google account settings.
              </ListItem>
              <ListItem>
                We may suspend or terminate your access if you violate these Terms or if continued
                operation creates legal or operational risk.
              </ListItem>
              <ListItem>
                Sections that by their nature should survive (e.g., 7–10) will survive termination.
              </ListItem>
            </UnorderedList>
          </Section>

          <Section title="12. Changes to the service or terms">
            <Text>
              We may modify the Service or these Terms over time. We will update the effective date
              at the top of this page, and material changes may also be communicated in-app.
              Continued use after the changes take effect means you accept the updated Terms.
            </Text>
          </Section>

          <Section title="13. Governing law">
            <Text>
              These Terms are governed by the laws of India, without regard to its conflict-of-laws
              rules. Disputes will be subject to the exclusive jurisdiction of the competent courts
              located in India, except where applicable law requires otherwise.
            </Text>
          </Section>

          <Section title="14. Contact">
            <Text>
              Questions about these Terms:{' '}
              <Link href={`mailto:${CONTACT_EMAIL}`} color="brand.700" textDecoration="underline">
                {CONTACT_EMAIL}
              </Link>
              .
            </Text>
          </Section>
        </VStack>
      </PageContainer>
    </Layout>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Heading size="md" color="brand.900" mb={2}>
        {title}
      </Heading>
      <VStack align="stretch" spacing={2} color="gray.800" fontSize="sm">
        {children}
      </VStack>
    </Box>
  )
}
