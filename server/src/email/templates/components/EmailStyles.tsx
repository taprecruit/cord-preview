// Shared styles for email templates
// Matches the mailer design system from /Users/skyler.sorensen/src/taprecruit-dev-env/tf/mailer
export const emailStyles = {
  // Color palette matching mailer
  colors: {
    primary: '#4022A1',
    textLight: '#AAAAAA',
    secondary: '#FF6A5B',
    offwhite: '#FAFAFA',
    white: '#FFFFFF',
    chromegreen: '#34A853',
    edgeblue: '#0095DD',
    basicRed: '#E63535',
    basicYellow: '#E6A700',
    basicBlue: '#007CCC',
  },
  body: {
    fontFamily: 'Inter, Roboto, "Helvetica Neue", arial, helvetica, sans-serif',
    fontSize: '16px',
    color: '#000000',
    backgroundColor: '#FAFAFA', // offwhite
    margin: 0,
    padding: '45px 0 0 0', // pt-45 from mailer
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#FFFFFF', // white
    padding: '20px', // p-20 from mailer
  },
  messageBox: {
    backgroundColor: 'rgb(250,250,250)',
    borderRadius: '8px',
    border: 'none',
    marginBottom: '48px',
    padding: '24px',
    width: '100%',
  },
  divider: {
    borderTop: '1px solid #dadce0',
    margin: '0 auto',
    maxWidth: '300px',
    textAlign: 'center' as const,
  },
  dividerLabel: {
    backgroundColor: '#dadce0',
    borderRadius: '4px',
    padding: '4px 8px',
    color: '#000000',
  },
  button: {
    textDecoration: 'none',
    background: '#FF6A5B', // secondary color from mailer
    border: 'none',
    color: '#ffffff',
    borderRadius: '8px', // rounded-lg
    padding: '12px 18px', // py-3 px-[18px] from mailer
    textAlign: 'center' as const,
    display: 'inline-block',
    fontSize: '16px',
    lineHeight: '24px',
    cursor: 'pointer',
  },
  link: {
    color: '#4022A1', // primary color from mailer
    textDecoration: 'underline',
  },
  text: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#000000',
    margin: '0 0 16px 0',
  },
  textLight: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#AAAAAA', // textLight from mailer
    margin: '0 0 16px 0',
  },
};
