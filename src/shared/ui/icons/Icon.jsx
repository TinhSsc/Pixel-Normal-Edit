import React from 'react';

const Icon = ({ name, className, style, id, ...props }) => {
  return (
    <i data-lucide={name} className={className} style={style} id={id} {...props}></i>
  );
};

export default Icon;
