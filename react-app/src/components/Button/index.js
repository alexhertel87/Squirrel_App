import React from "react";
import styles from './Button.module.css';

export default function Button({ text, action, color, width, fontSize, type = 'button' }) {
  const buttonStyle = {
    backgroundColor: color,
    width: typeof width === 'number' ? `${width}px` : width,
    fontSize,
  };

  return (
    <button
      className={styles.button}
      onClick={action}
      style={buttonStyle}
      type={type}
    >
      {text}
    </button>
  );
}
