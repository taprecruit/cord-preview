import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Link,
  Preview,
} from '@react-email/components';
import React from 'react';
import { MessageBlock } from 'server/src/email/templates/components/MessageBlock.tsx';
import { Divider } from 'server/src/email/templates/components/Divider.tsx';
import { EmailFooter } from 'server/src/email/templates/components/EmailFooter.tsx';
import { emailStyles } from 'server/src/email/templates/components/EmailStyles.tsx';

interface UserDetails {
  name: string;
  profile_picture: string | null;
  initial: string;
}

interface MessageDetails {
  message: string;
  message_type: string;
}

interface ThreadResolveProps {
  action: string;
  pageName: string;
  pageURL: string;
  currentMessageDetails: MessageDetails;
  currentMessageUserDetails: UserDetails;
  previousMessageDetails?: MessageDetails | null;
  previousMessageUserDetails?: UserDetails | null;
  firstMessageDetails?: MessageDetails | null;
  firstMessageUserDetails?: UserDetails | null;
  messagesCountLeft: number;
  unsubscribeURL: string;
  partnerName?: string | null;
  partnerImageURL?: string | null;
  imageHeight?: string;
  imageWidth?: string;
  showPoweredBy?: boolean;
}

export const ThreadResolve = ({
  action,
  pageName,
  pageURL,
  currentMessageDetails,
  currentMessageUserDetails,
  previousMessageDetails,
  previousMessageUserDetails,
  firstMessageDetails,
  firstMessageUserDetails,
  messagesCountLeft,
  unsubscribeURL,
  partnerName,
  partnerImageURL,
  imageHeight = 'auto',
  imageWidth = '140',
  showPoweredBy = true,
}: ThreadResolveProps) => {
  const defaultLogoUrl = 'https://static.datapeople.io/logo-orange-with-payscale.png';

  return (
    <Html>
      <Head />
      <Preview>
        {currentMessageUserDetails.name} {action} -
      </Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          {/* Partner/Logo Header */}
          <Section style={{ marginBottom: '48px', textAlign: 'center' }}>
            {partnerImageURL ? (
              <Img
                src={partnerImageURL}
                alt={partnerName || ''}
                height={imageHeight}
                width={imageWidth}
                style={{
                  display: 'block',
                  maxHeight: '120px',
                  maxWidth: '240px',
                  objectFit: 'contain',
                  margin: '0 auto',
                }}
              />
            ) : (
              <Link href="https://app.datapeople.io/">
                <Img
                  src={defaultLogoUrl}
                  alt="Datapeople"
                  height={imageHeight}
                  width={imageWidth}
                  style={{
                    display: 'block',
                    maxHeight: '120px',
                    maxWidth: '240px',
                    objectFit: 'contain',
                    margin: '0 auto',
                  }}
                />
              </Link>
            )}
          </Section>

          {/* Action text */}
          <Section style={{ marginBottom: '48px', textAlign: 'center' }}>
            <Text
              style={{
                ...emailStyles.text,
                fontSize: '18px',
                margin: 0,
              }}
            >
              <strong>{currentMessageUserDetails.name}</strong> {action}{' '}
              <Link href={pageURL} style={emailStyles.link}>
                {pageName}
              </Link>
            </Text>
          </Section>

          {/* Current message */}
          <Section style={emailStyles.messageBox}>
            <MessageBlock
              userDetails={currentMessageUserDetails}
              messageDetails={currentMessageDetails}
            />
          </Section>

          {/* Previous message */}
          {previousMessageDetails && previousMessageUserDetails && (
            <Section style={{ marginBottom: '48px' }}>
              <Divider label="In reply to" />
              <div style={{ padding: '24px' }}>
                <MessageBlock
                  userDetails={previousMessageUserDetails}
                  messageDetails={previousMessageDetails}
                />
              </div>
            </Section>
          )}

          {/* First message */}
          {firstMessageDetails && firstMessageUserDetails && (
            <Section style={{ marginBottom: '48px' }}>
              <Divider
                label={
                  messagesCountLeft === 0
                    ? 'First message in thread'
                    : messagesCountLeft === 1
                      ? `+ ${messagesCountLeft} message since the first message`
                      : `+ ${messagesCountLeft} messages since the first message`
                }
              />
              <div style={{ padding: '24px' }}>
                <MessageBlock
                  userDetails={firstMessageUserDetails}
                  messageDetails={firstMessageDetails}
                />
              </div>
            </Section>
          )}

          {/* Divider before footer */}
          {(firstMessageDetails || previousMessageDetails) && (
            <Section style={{ marginBottom: '48px' }}>
              <div
                style={{
                  borderTop: '1px solid #dadce0',
                  textAlign: 'center',
                }}
              />
            </Section>
          )}

          {/* Unsubscribe */}
          <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Link href={unsubscribeURL} style={emailStyles.link}>
              Unsubscribe from this thread.
            </Link>
          </Section>

          {/* Powered by Cord */}
          {showPoweredBy && (
            <Section style={{ textAlign: 'center' }}>
              <Text style={emailStyles.textLight}>
                <Link
                  href="https://app.datapeople.io"
                  style={{
                    color: emailStyles.colors.textLight,
                    textDecoration: 'none',
                  }}
                >
                  Collaboration powered by Cord
                </Link>
              </Text>
            </Section>
          )}
        </Container>
        <EmailFooter showLogo={false} />
      </Body>
    </Html>
  );
};

ThreadResolve.PreviewProps = {
  action: 'resolved',
  pageName: 'Example Page',
  pageURL: 'https://example.com/page',
  currentMessageDetails: {
    message: 'This is a sample message',
    message_type: 'user_message',
  },
  currentMessageUserDetails: {
    name: 'John Doe',
    profile_picture: null,
    initial: 'JD',
  },
  previousMessageDetails: {
    message: 'This is a previous message in the thread',
    message_type: 'user_message',
  },
  previousMessageUserDetails: {
    name: 'Jane Smith',
    profile_picture: null,
    initial: 'JS',
  },
  firstMessageDetails: {
    message: 'This is the first message in the thread',
    message_type: 'user_message',
  },
  firstMessageUserDetails: {
    name: 'Bob Johnson',
    profile_picture: null,
    initial: 'BJ',
  },
  messagesCountLeft: 2,
  unsubscribeURL: 'https://example.com/unsubscribe',
  // partnerName: 'Example Partner',
  // partnerImageURL: 'https://via.placeholder.com/140x40',
  imageHeight: '40',
  imageWidth: '140',
  showPoweredBy: false,
};

export default ThreadResolve;
