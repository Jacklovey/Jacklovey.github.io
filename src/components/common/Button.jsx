import React from 'react';
import { Button as AntdButton } from 'antd-mobile';
import PropTypes from 'prop-types';
import './Button.module.css';

/**
 * 通用按钮组件
 * 基于 antd-mobile Button 组件封装
 */
const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'middle',
  disabled = false,
  loading = false,
  block = false,
  shape = 'default',
  onClick,
  type = 'button',
  className = '',
  'data-testid': testId,
  ...rest
}, ref) => {
  const buttonProps = {
    color: variant,
    size,
    disabled,
    loading,
    block,
    shape,
    onClick,
    type,
    className,
    'data-testid': testId,
    ref,
    ...rest
  };

  return (
    <AntdButton {...buttonProps}>
      {children}
    </AntdButton>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'default', 'danger', 'warning']),
  size: PropTypes.oneOf(['small', 'middle', 'large']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  block: PropTypes.bool,
  shape: PropTypes.oneOf(['default', 'rounded', 'rectangular']),
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
  'data-testid': PropTypes.string,
};

export default Button;
