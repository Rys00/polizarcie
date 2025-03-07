"use client";

import { parseBigNumber } from "@/utils/misc";
import { LegacyRef, MouseEvent, TouchEvent, useRef } from "react";
import styles from "./sliders.module.scss";

type Range = {
  min: number;
  max: number;
};

type Props = {
  id?: string;
  name?: string;
  value: number;
  limit: Range;
  onChange: (value: number) => void;
  step?: number;
  suffix?: string;
  label?: string;
  disabled?: boolean;
};

const SliderInput = ({
  id,
  name,
  value,
  limit,
  onChange,
  step,
  suffix,
  label,
  disabled,
}: Props) => {
  const axisRef = useRef<HTMLDivElement>();

  const axisValueAt = (clientX: number): number => {
    const axis = axisRef.current;
    if (!axis) return 0;
    const left = axis.getBoundingClientRect().left;
    const width = axis.getBoundingClientRect().right - left;
    const percentage = Math.max(0, Math.min((clientX - left) / width, 1));
    return (
      Math.round(
        Math.round(((limit.max - limit.min) * percentage) / (step || 1)) *
          (step || 1)
      ) + limit.min
    );
  };

  const clamp = (value: number) =>
    Math.max(limit.min, Math.min(value, limit.max));

  const handleOnMouseEvent = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.buttons !== 1) return; // if left mouse button not clicked
    const dotValue = axisValueAt(e.clientX);
    onChange(clamp(dotValue));
  };
  const handleOnTouchEvent = (e: TouchEvent<HTMLDivElement>) => {
    if (disabled) return;
    const dotValue = axisValueAt(e.touches.item(0)?.clientX || 0);
    onChange(clamp(dotValue));
  };

  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ""}`}>
      <div
        className={styles.slider}
        onMouseMove={handleOnMouseEvent}
        onMouseDown={handleOnMouseEvent}
        onTouchMove={handleOnTouchEvent}
      >
        <span className={styles.limit}>{parseBigNumber(limit.min)}</span>
        <div className={styles.axis} ref={axisRef as LegacyRef<HTMLDivElement>}>
          <div
            className={styles.dot}
            style={{
              left: `${((value - limit.min) / (limit.max - limit.min)) * 100}%`,
            }}
          >
            <i className="fa-solid fa-circle-dot"></i>
          </div>
        </div>
        <span className={styles.value}>
          {parseBigNumber(value)}
          {suffix}
        </span>
        <span className={styles.limit}>{parseBigNumber(limit.max)}</span>
      </div>
      <input
        className={styles.invisible}
        id={id}
        name={name}
        type="number"
        value={value}
        disabled
      />
      {label && <label>{label}</label>}
    </div>
  );
};

export default SliderInput;
