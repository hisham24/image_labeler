import React from 'react';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';
import { Link as RouterLink } from 'react-router-dom';

const Footer = () => {
  return (
      <Typography variant="body2" color="textSecondary" align="center">
        {'Copyright © '}
        <Link variant="body2" component={RouterLink} to='/'>
                {'Image Labeler '}
        </Link>
        {new Date().getFullYear()}
        {'.'}
      </Typography>
  );
};

export default Footer;
