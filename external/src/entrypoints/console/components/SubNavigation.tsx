import { Nav, Tab } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { Typography } from '@mui/material';
import { Sizes } from 'common/const/Sizes.ts';
import { Colors } from 'common/const/Colors.ts';

const useStyles = createUseStyles({
  tab: {
    display: 'block',
    color: Colors.GREY_X_DARK,
    textDecoration: 'none',
    padding: `0 0.75rem 1.5rem 0.75rem`,
    backgroundColor: 'transparent',
    '&:hover': {
      color: Colors.GREY_DARK,
      textDecoration: 'none',
    },
  },
  activeTab: {
    textDecoration: 'none',
    '&:hover': {
      color: Colors.GREY_X_DARK,
    },
  },
  borderTop: {
    width: '100%',
    margin: '0 auto',
    borderTop: `3px ${Colors.BRAND_PURPLE_DARK} solid`,
  },
  borderTopInvisible: {
    width: '100%',
    borderTop: `3px transparent solid`,
  },
});

function SubNavigationItem({
  baseUrl: url,
  pathName,
  tabName,
}: {
  baseUrl: string;
  pathName: string;
  tabName: string;
}) {
  const classes = useStyles();
  const location = useLocation();
  const currentlyActive = location.pathname.startsWith(`${url}/${pathName}`);

  return (
    <Nav.Item>
      <Nav.Link
        bsPrefix={cx(classes.tab, {
          [classes.activeTab]: currentlyActive,
        })}
        as={Link}
        to={`${url}/${pathName}`}
        active={currentlyActive}
      >
        <Typography
          variant="body1"
          color={currentlyActive ? Colors.BRAND_PURPLE_DARK : Colors.BLACK}
        >
          {tabName}
        </Typography>
      </Nav.Link>
      <div
        className={
          currentlyActive ? classes.borderTop : classes.borderTopInvisible
        }
      ></div>
    </Nav.Item>
  );
}

export function SubNavigation({
  baseUrl,
  navigationItems,
}: {
  baseUrl: string;
  navigationItems: { [key: string]: string };
}) {
  return (
    <>
      <Tab.Container>
        <Nav variant="tabs" style={{ marginBottom: Sizes.XLARGE }}>
          {Object.entries(navigationItems).map(([pathName, tabName]) => (
            <SubNavigationItem
              key={pathName}
              baseUrl={baseUrl}
              pathName={pathName}
              tabName={tabName}
            />
          ))}
        </Nav>
      </Tab.Container>
    </>
  );
}
