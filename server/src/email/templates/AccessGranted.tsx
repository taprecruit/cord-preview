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

interface AccessGrantedProps {
  consoleLink: string;
  customerName: string;
}

export const AccessGranted = ({
  consoleLink,
  customerName,
}: AccessGrantedProps) => {
  return (
    <Html>
      <Head />
      <Preview>Access granted to {customerName} in Cord console</Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <Text style={emailStyles.text}>
            You now have access to {customerName} in the Cord console.
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

AccessGranted.PreviewProps = {
  consoleLink: 'https://console.cord.fyi',
  customerName: 'Acme Corp',
};

export default AccessGranted;
