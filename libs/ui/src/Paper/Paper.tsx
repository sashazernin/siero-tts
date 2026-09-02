import React from 'react';
import styles from './Paper.module.css';

export interface PaperProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: 1 | 2;
}

export function Paper({ elevation = 1, className = '', children, ...props }: PaperProps) {
  const classes = [styles.paper, styles[`elevation${elevation}`], className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
