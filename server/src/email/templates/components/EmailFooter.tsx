import { Container, Section, Text } from '@react-email/components';
import React from 'react';
import { emailStyles } from 'server/src/email/templates/components/EmailStyles.tsx';

const DEFAULT_ADDRESS =
  '68 Harrison Ave Ste 605 PMB 96140 Boston, MA 02111-1929';

export interface EmailFooterProps {
  /** Company address. Defaults to Datapeople HQ. */
  address?: string;
}

export const EmailFooter = ({ address = DEFAULT_ADDRESS }: EmailFooterProps) => {
  return (
    <Container
      style={{
        maxWidth: '600px',
        margin: '36px auto 0',
        padding: '0 20px 45px',
      }}
    >
      <Section style={{ textAlign: 'center' }}>
        <Text
          style={{
            fontSize: 12,
            lineHeight: '18px',
            color: emailStyles.colors.textLight,
            margin: 0,
            textAlign: 'center',
          }}
        >
          Datapeople, a Payscale company, {address}
        </Text>
      </Section>
    </Container>
  );
};
