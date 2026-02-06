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

interface AccessDeniedProps {
  consoleLink: string;
  customerName: string;
}

export const AccessDenied = ({
  consoleLink,
  customerName,
}: AccessDeniedProps) => {
  return (
    <Html>
      <Head />
      <Preview>Access denied to {customerName} in Cord console</Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <Text style={emailStyles.text}>
            Your access to {customerName} in the Cord console has been denied.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '24px' }}>
            <Button href={consoleLink} style={emailStyles.button}>
              Go to Console
            </Button>
          </Section>
        </Container>
        <EmailFooter />
      </Body>
    </Html>
  );
};

AccessDenied.PreviewProps = {
  consoleLink: 'https://console.cord.fyi',
  customerName: 'Acme Corp',
};

export default AccessDenied;
