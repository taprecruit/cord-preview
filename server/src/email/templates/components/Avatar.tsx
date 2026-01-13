import { Img } from '@react-email/components';
import React from 'react';

interface AvatarProps {
  profilePicture: string | null;
  initial: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({
  profilePicture,
  initial,
  size = 20,
}) => {
  if (profilePicture) {
    return (
      <Img
        src={profilePicture}
        alt={`Avatar`}
        width={size}
        height={size}
        style={{
          borderRadius: '50%',
          marginRight: '8px',
        }}
      />
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#000000',
        borderRadius: '50%',
        border: '1px solid #ffffff',
        color: '#ffffff',
        height: `${size}px`,
        width: `${size}px`,
        lineHeight: `${size}px`,
        marginRight: '8px',
        textAlign: 'center',
        display: 'inline-block',
        fontSize: `${size * 0.6}px`,
      }}
    >
      {initial}
    </div>
  );
};
