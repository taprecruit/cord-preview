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
import { emailStyles } from 'server/src/email/templates/components/EmailStyles.tsx';

interface ConsoleInviteProps {
  inviteLink: string;
  inviterName: string;
  customerName: string;
}

export const ConsoleInvite = ({
  inviteLink,
  inviterName,
  customerName,
}: ConsoleInviteProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} has invited you to join {customerName}&apos;s Cord console
        account.
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <Text style={emailStyles.text}>
            {inviterName} has invited you to join {customerName}&apos;s Cord
            console account.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: '24px' }}>
            <Button href={inviteLink} style={emailStyles.button}>
              Accept Invitation
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

ConsoleInvite.PreviewProps = {
  inviteLink: 'https://console.cord.fyi/invite/sample-token',
  inviterName: 'John Doe',
  customerName: 'Acme Corp',
};

export default ConsoleInvite;
