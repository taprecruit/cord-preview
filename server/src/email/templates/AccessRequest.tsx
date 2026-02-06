import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Preview,
} from '@react-email/components';
import React from 'react';
import { EmailFooter } from 'server/src/email/templates/components/EmailFooter.tsx';
import { emailStyles } from 'server/src/email/templates/components/EmailStyles.tsx';

interface AccessRequestProps {
  senderEmail: string;
  customerName: string;
  viewAccessRequestsLink: string;
}

export const AccessRequest = ({
  senderEmail,
  customerName,
  viewAccessRequestsLink,
}: AccessRequestProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        {senderEmail} has requested access to {customerName} in Cord console
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <Text style={emailStyles.text}>
            {senderEmail} has requested access to {customerName} in the Cord
            console.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '24px' }}>
            <Button href={viewAccessRequestsLink} style={emailStyles.button}>
              View Access Requests
            </Button>
          </Section>
        </Container>
        <EmailFooter />
      </Body>
    </Html>
  );
};

AccessRequest.PreviewProps = {
  senderEmail: 'user@example.com',
  customerName: 'Acme Corp',
  viewAccessRequestsLink: 'https://console.cord.fyi/access-requests',
};

export default AccessRequest;
