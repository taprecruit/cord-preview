import React from 'react';

interface DividerProps {
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({ label }) => {
  return (
    <table width="100%" cellPadding="0" cellSpacing="0">
      <tr>
        <td>
          <div
            style={{
              borderTop: '1px solid #dadce0',
              margin: '0 auto',
              maxWidth: '300px',
              textAlign: 'center',
            }}
          />
        </td>
        {label && (
          <>
            <td
              align="center"
              style={{
                backgroundColor: '#dadce0',
                borderRadius: '4px',
                padding: '4px 8px',
                width: '1%',
                color: '#000000',
                whiteSpace: 'nowrap' as const,
              }}
            >
              {label}
            </td>
            <td>
              <div
                style={{
                  borderTop: '1px solid #dadce0',
                  margin: '0 auto',
                  maxWidth: '300px',
                  textAlign: 'center',
                }}
              />
            </td>
          </>
        )}
      </tr>
    </table>
  );
};
