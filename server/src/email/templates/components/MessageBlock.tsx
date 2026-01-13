import { Text } from '@react-email/components';
import React from 'react';
import { Avatar } from 'server/src/email/templates/components/Avatar.tsx';

interface UserDetails {
  name: string;
  profile_picture: string | null;
  initial: string;
}

interface MessageDetails {
  message: string;
  message_type: string;
}

interface MessageBlockProps {
  userDetails: UserDetails;
  messageDetails: MessageDetails;
}

export const MessageBlock: React.FC<MessageBlockProps> = ({
  userDetails,
  messageDetails,
}) => {
  if (messageDetails.message_type === 'user_message') {
    return (
      <>
        <table
          cellPadding="0"
          cellSpacing="0"
          style={{ marginBottom: '16px', width: '100%' }}
        >
          <tr>
            <td style={{ width: '0%', verticalAlign: 'top' }}>
              <Avatar
                profilePicture={userDetails.profile_picture}
                initial={userDetails.initial}
              />
            </td>
            <td style={{ verticalAlign: 'top' }}>
              <Text style={{ margin: 0, color: '#000000', fontWeight: 'bold' }}>
                {userDetails.name}
              </Text>
            </td>
          </tr>
        </table>
        <table cellPadding="0" cellSpacing="0" style={{ marginBottom: '16px' }}>
          <tr>
            <td
              style={{
                fontSize: '16px',
                lineHeight: '24px',
                color: '#000000',
              }}
              dangerouslySetInnerHTML={{ __html: messageDetails.message }}
            />
          </tr>
        </table>
      </>
    );
  }

  return (
    <table cellPadding="0" cellSpacing="0">
      <tr>
        <td style={{ verticalAlign: 'top' }}>
          <Text style={{ margin: 0, color: '#191A1E', fontStyle: 'italic' }}>
            <strong>{userDetails.name}</strong>{' '}
            <span
              dangerouslySetInnerHTML={{ __html: messageDetails.message }}
            />
          </Text>
        </td>
      </tr>
    </table>
  );
};
