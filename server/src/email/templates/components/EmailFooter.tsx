import { Container, Img, Link, Section, Text } from '@react-email/components';
import React from 'react';
import { emailStyles } from 'server/src/email/templates/components/EmailStyles.tsx';

const DEFAULT_ADDRESS =
  '68 Harrison Ave Ste 605 PMB 96140 Boston, MA 02111-1929';

const logoImgProps = {
  src: 'https://static.datapeople.io/logo-orange-with-payscale.png',
  alt: 'Datapeople',
};

export interface EmailFooterProps {
  /** Company address. Defaults to Datapeople HQ. */
  address?: string;
  /** When true, show the Datapeople logo above the address in the footer. Use for templates that have no logo in the header. */
  showLogo?: boolean;
}

export const EmailFooter = ({
  address = DEFAULT_ADDRESS,
  showLogo = false,
}: EmailFooterProps) => {
  return (
    <Container
      style={{
        maxWidth: '600px',
        margin: '36px auto 0',
        padding: '0 20px 45px',
      }}
    >
      <Section style={{ textAlign: 'center' }}>
        {showLogo && (
          <Link href="https://app.datapeople.io/">
            <Img
              {...logoImgProps}
              width={91}
              height={31}
              style={{
                display: 'block',
                margin: '0 auto 20px',
                maxWidth: 91,
                maxHeight: 31,
                objectFit: 'contain',
              }}
            />
          </Link>
        )}
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
