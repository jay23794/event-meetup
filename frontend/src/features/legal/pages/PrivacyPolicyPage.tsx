import { Box, Heading, Text, VStack, Link, UnorderedList, ListItem, Divider } from '@chakra-ui/react'
import { Layout } from '../../../shared/components/Layout'
import { PageContainer } from '../../../shared/components/PageContainer'

const EFFECTIVE_DATE = 'May 16, 2026'
const CONTACT_EMAIL = 'inquiry@bigfynite.com'

export function PrivacyPolicyPage() {
  return (
    <Layout>
      <PageContainer>
        <VStack align="stretch" spacing={6} maxW="3xl" mx="auto" py={4}>
          <Box>
            <Heading size="lg" color="brand.900">
              Privacy Policy
            </Heading>
            <Text color="gray.600" fontSize="sm" mt={1}>
              Effective date: {EFFECTIVE_DATE}
            </Text>
          </Box>

          <Text>
            Meet Sync (&quot;we&quot;, &quot;us&quot;) helps event exhibitors and visitors capture
            and share booth information. This policy explains what we collect, why we collect it,
            and the choices you have. By signing in with Google and using Meet Sync, you agree to
            this policy.
          </Text>

          <Divider />

          <Section title="1. Information we collect">
            <Text>When you sign in and use Meet Sync, we collect:</Text>
            <UnorderedList spacing={1} pl={6}>
              <ListItem>
                <b>Account profile</b> — your name and email address from your Google account, used
                to create and identify your Meet Sync user.
              </ListItem>
              <ListItem>
                <b>Google OAuth tokens</b> — a refresh token used to call Google Drive and Google
                Sheets on your behalf. Stored encrypted-at-rest in our database and never shared.
              </ListItem>
              <ListItem>
                <b>Event &amp; booth data</b> — event names, booth names, descriptions, QR IDs, scan
                counts, and document metadata you create in the app.
              </ListItem>
              <ListItem>
                <b>Uploaded files</b> — images and PDFs you upload (business cards, brochures) are
                stored in <b>your own</b> Google Drive under a MeetSync folder we create. Meet Sync
                does not keep copies of these files.
              </ListItem>
              <ListItem>
                <b>Extracted text</b> — text extracted by OCR (Tesseract in your browser, plus
                structured fields via Anthropic&apos;s Claude API) is written to your Google Sheet
                and stored on the document record.
              </ListItem>
              <ListItem>
                <b>Visitor check-in data</b> — when a visitor scans a booth QR code, their name,
                email, and optional phone number are written to the booth owner&apos;s Google Sheet.
              </ListItem>
            </UnorderedList>
          </Section>

          <Section title="2. Google API access &amp; scopes">
            <Text>Meet Sync requests these Google OAuth scopes:</Text>
            <UnorderedList spacing={1} pl={6}>
              <ListItem>
                <code>userinfo.profile</code>, <code>userinfo.email</code> — to identify your
                account.
              </ListItem>
              <ListItem>
                <code>drive.file</code> — to create and access files Meet Sync creates in your
                Drive. We do not see files we did not create.
              </ListItem>
              <ListItem>
                <code>spreadsheets</code> — to create and update the Google Sheets that store your
                booth data.
              </ListItem>
            </UnorderedList>
            <Text mt={3}>
              Meet Sync&apos;s use of information received from Google APIs adheres to the{' '}
              <Link
                href="https://developers.google.com/terms/api-services-user-data-policy"
                isExternal
                color="brand.700"
                textDecoration="underline"
              >
                Google API Services User Data Policy
              </Link>
              , including the Limited Use requirements.
            </Text>
          </Section>

          <Section title="3. How we use your information">
            <UnorderedList spacing={1} pl={6}>
              <ListItem>To create and operate your Meet Sync account.</ListItem>
              <ListItem>
                To create folders and spreadsheets in your Google Drive and write booth data to
                them.
              </ListItem>
              <ListItem>
                To process uploaded images/PDFs through OCR and a large language model to extract
                contact details from business cards and brochures.
              </ListItem>
              <ListItem>
                To share booth documents with visitors who scan a booth QR code, by granting their
                Google account read access to the relevant Drive files.
              </ListItem>
              <ListItem>To troubleshoot issues and improve the product.</ListItem>
            </UnorderedList>
          </Section>

          <Section title="4. Third-party services">
            <Text>
              We rely on a small number of providers to run Meet Sync. They process data only as
              needed to provide their service:
            </Text>
            <UnorderedList spacing={1} pl={6}>
              <ListItem>
                <b>Google</b> — authentication, Drive storage, Sheets storage.
              </ListItem>
              <ListItem>
                <b>Anthropic</b> — Claude API receives OCR text (and, for business-card scans,
                compressed images) to return structured fields. Anthropic does not train on data
                sent through the API.
              </ListItem>
              <ListItem>
                <b>MongoDB Atlas</b> — managed database for account and metadata.
              </ListItem>
            </UnorderedList>
            <Text mt={3}>
              We do not sell personal information. We do not share it with advertisers.
            </Text>
          </Section>

          <Section title="5. Data retention">
            <UnorderedList spacing={1} pl={6}>
              <ListItem>
                Account, event, booth, and document metadata are retained while your account is
                active.
              </ListItem>
              <ListItem>
                Files in your Google Drive remain in your control — deleting a document in Meet
                Sync removes the record from our database but does not delete the underlying Drive
                file.
              </ListItem>
              <ListItem>
                You can disconnect Meet Sync at any time from your Google account settings.
              </ListItem>
              <ListItem>
                On request to {CONTACT_EMAIL}, we will delete your account and associated metadata.
              </ListItem>
            </UnorderedList>
          </Section>

          <Section title="6. Your choices &amp; rights">
            <UnorderedList spacing={1} pl={6}>
              <ListItem>Access, correct, or delete the data we hold about you.</ListItem>
              <ListItem>Revoke Meet Sync&apos;s Google access at any time.</ListItem>
              <ListItem>
                Opt out of having your check-in details written to an exhibitor&apos;s sheet by
                declining to scan the booth QR code.
              </ListItem>
            </UnorderedList>
          </Section>

          <Section title="7. Security">
            <Text>
              We use TLS in transit, restrict OAuth refresh tokens to backend services only, and
              follow the principle of least privilege for API scopes. No system is perfectly
              secure, so please report any suspected vulnerability to {CONTACT_EMAIL}.
            </Text>
          </Section>

          <Section title="8. Children">
            <Text>
              Meet Sync is not directed to children under 13, and we do not knowingly collect data
              from them.
            </Text>
          </Section>

          <Section title="9. Changes">
            <Text>
              We may update this policy. Material changes will be reflected by a new effective date
              at the top of this page, and where appropriate, by in-app notice.
            </Text>
          </Section>

          <Section title="10. Contact">
            <Text>
              Questions or requests:{' '}
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
