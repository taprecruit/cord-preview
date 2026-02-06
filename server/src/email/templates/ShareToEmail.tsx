import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Link,
  Button,
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
  message_preview: string;
  message_type: string;
  annotations?: {
    first_annotation: string | null;
    other_annotations: string[];
    extra_number_annotations: number;
  } | null;
  file_names?: string[];
}

interface ShareToEmailProps {
  senderName: string;
  pageName: string;
  pageURL: string;
  currentMessageDetails: MessageDetails;
  currentMessageUserDetails: UserDetails;
  previousMessageDetails?: MessageDetails | null;
  previousMessageUserDetails?: UserDetails | null;
  firstMessageDetails?: MessageDetails | null;
  firstMessageUserDetails?: UserDetails | null;
  messagesCountLeft: number;
  partnerName?: string | null;
  partnerImageURL?: string | null;
  imageHeight?: string;
  imageWidth?: string;
  inviteURL?: string | null;
  showPoweredBy?: boolean;
}

export const ShareToEmail = ({
  senderName,
  pageName,
  pageURL,
  currentMessageDetails,
  currentMessageUserDetails,
  previousMessageDetails,
  previousMessageUserDetails,
  firstMessageDetails,
  firstMessageUserDetails,
  messagesCountLeft,
  partnerName,
  partnerImageURL,
  imageHeight = 'auto',
  imageWidth = '140',
  inviteURL,
  showPoweredBy = true,
}: ShareToEmailProps) => {
  const mentionIconUrl =
    'https://static.datapeople.io/cord/static/email/mention-circle.png';
  const defaultLogoUrl = 'https://static.datapeople.io/logo-orange-with-payscale.png';

  return (
    <Html>
      <Head />
      <Preview>{currentMessageDetails.message_preview} -</Preview>
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
              <Link href="https://app.datapeople.io">
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
            <table
              cellSpacing="0"
              cellPadding="0"
              align="center"
              style={{ margin: '0 auto' }}
            >
              <tr>
                <td style={{ verticalAlign: 'middle', paddingRight: '8px' }}>
                  <Img
                    src={mentionIconUrl}
                    alt="mention-icon"
                    height={30}
                    width={30}
                    style={{ display: 'block' }}
                  />
                </td>
                <td style={{ verticalAlign: 'middle' }}>
                  <Text
                    style={{
                      ...emailStyles.text,
                      fontSize: '18px',
                      margin: 0,
                    }}
                  >
                    <strong>{senderName}</strong> shared a thread with you on{' '}
                    <Link href={pageURL} style={emailStyles.link}>
                      {pageName}
                    </Link>
                  </Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* Current message */}
          <Section style={emailStyles.messageBox}>
            <MessageBlock
              userDetails={currentMessageUserDetails}
              messageDetails={currentMessageDetails}
            />

            {/* Annotations */}
            {currentMessageDetails.annotations?.first_annotation && (
              <>
                <Link href={pageURL}>
                  <Img
                    src={currentMessageDetails.annotations.first_annotation}
                    alt="screenshot"
                    width={600}
                    style={{
                      display: 'block',
                      maxWidth: '100%',
                      width: '100%',
                      height: 'auto',
                      border: '1px solid #dadce0',
                      borderRadius: '8px',
                      marginTop: '16px',
                    }}
                  />
                </Link>

                {currentMessageDetails.annotations.other_annotations &&
                  currentMessageDetails.annotations.other_annotations.length >
                    0 && (
                    <table
                      width="100%"
                      cellPadding="0"
                      cellSpacing="0"
                      style={{ marginTop: '16px' }}
                    >
                      <tr>
                        {currentMessageDetails.annotations
                          .other_annotations[0] && (
                          <td
                            width={
                              currentMessageDetails.annotations
                                .other_annotations[1]
                                ? '48%'
                                : '100%'
                            }
                            style={{ paddingRight: '2%' }}
                          >
                            <Link href={pageURL}>
                              <Img
                                src={
                                  currentMessageDetails.annotations
                                    .other_annotations[0]
                                }
                                alt="screenshot"
                                width={
                                  currentMessageDetails.annotations
                                    .other_annotations[1]
                                    ? 272
                                    : 600
                                }
                                style={{
                                  display: 'block',
                                  maxWidth: '100%',
                                  width: '100%',
                                  height: 'auto',
                                  border: '1px solid #dadce0',
                                  borderRadius: '8px',
                                }}
                              />
                            </Link>
                          </td>
                        )}
                        {currentMessageDetails.annotations
                          .other_annotations[1] && (
                          <td width="48%">
                            <Link href={pageURL}>
                              <Img
                                src={
                                  currentMessageDetails.annotations
                                    .other_annotations[1]
                                }
                                alt="screenshot"
                                width={272}
                                style={{
                                  display: 'block',
                                  maxWidth: '100%',
                                  width: '100%',
                                  height: 'auto',
                                  border: '1px solid #dadce0',
                                  borderRadius: '8px',
                                }}
                              />
                            </Link>
                          </td>
                        )}
                      </tr>
                    </table>
                  )}

                {currentMessageDetails.annotations.extra_number_annotations >
                  0 && (
                  <table
                    align="center"
                    style={{
                      backgroundColor: '#dadce0',
                      borderRadius: '4px',
                      marginTop: '24px',
                      padding: '4px 8px',
                      textAlign: 'center',
                    }}
                  >
                    <tr>
                      <td style={{ padding: 0 }}>
                        <strong style={{ color: '#000000' }}>
                          +{' '}
                          {
                            currentMessageDetails.annotations
                              .extra_number_annotations
                          }{' '}
                          more
                        </strong>
                      </td>
                      <td style={{ padding: 0, color: '#000000' }}>
                        {' '}
                        {currentMessageDetails.annotations
                          .extra_number_annotations === 1
                          ? 'annotation'
                          : 'annotations'}
                      </td>
                    </tr>
                  </table>
                )}
              </>
            )}

            {/* File attachments */}
            {currentMessageDetails.file_names &&
              currentMessageDetails.file_names.length > 0 && (
                <table
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  style={{ marginTop: '24px' }}
                >
                  <tr>
                    <td style={{ color: '#aaaaac' }}>
                      {currentMessageDetails.file_names.length === 1
                        ? 'File'
                        : 'Files'}{' '}
                      shared
                    </td>
                  </tr>
                  {currentMessageDetails.file_names.map((fileName, idx) => (
                    <tr key={idx}>
                      <td style={{ paddingTop: '16px' }}>
                        <Link
                          href={pageURL}
                          style={{
                            textDecoration: 'none',
                            backgroundColor: '#dadce0',
                            color: '#000000',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            display: 'inline-block',
                          }}
                        >
                          <strong>{fileName}</strong>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </table>
              )}

            {/* Reply button */}
            {currentMessageDetails.message_type === 'user_message' && (
              <table
                align="center"
                cellPadding="0"
                cellSpacing="0"
                style={{ marginTop: '24px' }}
              >
                <tr>
                  <td style={{ padding: 0 }}>
                    <Button
                      href={inviteURL || pageURL}
                      style={emailStyles.button}
                    >
                      <strong>Reply</strong> to {currentMessageUserDetails.name}
                      &apos;s comment
                    </Button>
                  </td>
                </tr>
              </table>
            )}
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
        <EmailFooter />
      </Body>
    </Html>
  );
};

ShareToEmail.PreviewProps = {
  senderName: 'John Doe',
  pageName: 'Example Page',
  pageURL: 'https://example.com/page',
  currentMessageDetails: {
    message: 'This is a sample message with <strong>formatting</strong>',
    message_preview: 'This is a sample message',
    message_type: 'user_message',
    // annotations: {
    //   first_annotation: 'https://via.placeholder.com/600x400',
    //   other_annotations: [
    //     'https://via.placeholder.com/272x200',
    //     'https://via.placeholder.com/272x200',
    //   ],
    //   extra_number_annotations: 3,
    // },
    // file_names: ['document.pdf', 'spreadsheet.xlsx'],
  },
  currentMessageUserDetails: {
    name: 'John Doe',
    profile_picture: null,
    initial: 'JD',
  },
  previousMessageDetails: {
    message: 'This is a previous message in the thread',
    message_preview: 'This is a previous message in the thread',
    message_type: 'user_message',
  },
  previousMessageUserDetails: {
    name: 'Jane Smith',
    profile_picture: null,
    initial: 'JS',
  },
  firstMessageDetails: {
    message: 'This is the first message in the thread',
    message_preview: 'This is the first message in the thread',
    message_type: 'user_message',
  },
  firstMessageUserDetails: {
    name: 'Bob Johnson',
    profile_picture: null,
    initial: 'BJ',
  },
  messagesCountLeft: 2,
  // partnerName: 'Example Partner',
  // partnerImageURL: 'https://via.placeholder.com/140x40',
  imageHeight: '40',
  imageWidth: '140',
  inviteURL: 'https://example.com/invite',
  showPoweredBy: false,
};

export default ShareToEmail;
