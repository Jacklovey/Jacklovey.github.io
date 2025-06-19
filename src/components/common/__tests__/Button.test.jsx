import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

// 假设有一个通用Button组件
const Button = (props) => <button {...props}>{props.children}</button>;

expect.extend(toHaveNoViolations);

describe('Button component', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>测试按钮</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
